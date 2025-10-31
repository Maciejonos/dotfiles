Name = "bookmarks"
NamePretty = "Bookmarks"
Icon = ""
HideFromProviderlist = false
Cache = false
Action = "xdg-open '%VALUE%'"

local base_browser_names = {
	["google-chrome"] = "Chrome",
	["chromium"] = "Chromium",
	["BraveSoftware/Brave-Browser"] = "Brave",
	["brave-browser"] = "Brave",
	["microsoft-edge"] = "Edge",
	["opera"] = "Opera",
	["vivaldi"] = "Vivaldi",
	["net.imput.helium"] = "Helium",
}

local firefox_variants = {
	["%.zen/"] = "Zen",
	["%.librewolf/"] = "LibreWolf",
	["%.waterfox/"] = "Waterfox",
	["%.floorp/"] = "Floorp",
}

local function get_chromium_browser_name(dir_name)
	local base_name = dir_name:gsub("%-beta$", ""):gsub("%-unstable$", ""):gsub("%-dev$", ""):gsub("%-nightly$", "")
	local display_name = base_browser_names[base_name] or base_name

	if dir_name:match("%-beta") then
		return display_name .. " Beta"
	elseif dir_name:match("%-unstable") then
		return display_name .. " Dev"
	elseif dir_name:match("%-dev") then
		return display_name .. " Dev"
	elseif dir_name:match("%-nightly") or dir_name:match("Nightly") then
		return display_name .. " Nightly"
	else
		return display_name
	end
end

local function get_firefox_browser_name(profile_name)
	return profile_name:match("dev%-edition%-default") and "Firefox Developer" or "Firefox"
end

local function trim(s)
	if type(s) ~= "string" then
		return ""
	end
	return s:match("^%s*(.-)%s*$")
end

local function is_jq_installed()
	local handle = io.popen("which jq 2>/dev/null")
	if handle then
		local result = handle:read("*a")
		handle:close()
		return result ~= ""
	end
	return false
end
local function is_sqlite3_installed()
	local handle = io.popen("which sqlite3 2>/dev/null")
	if handle then
		local result = handle:read("*a")
		handle:close()
		return result ~= ""
	end
	return false
end
local function normalize_url(url)
	if not url then
		return ""
	end
	url = trim(url)
	url = url:gsub("^http://", "https://")
	url = url:gsub("/$", "")
	return url
end

local function read_chromium_bookmarks(path, browser_name)
	local bookmarks = {}
	local handle = io.popen(
		'jq -r \'.roots | .. | objects | select(.type == "url") | "\\(.name)|||\\(.url)"\' "' .. path .. '" 2>/dev/null'
	)
	if handle then
		for line in handle:lines() do
			local title, url = line:match("^(.+)|||(.+)$")
			if title and url then
				bookmarks[normalize_url(url)] = { title = trim(title), url = trim(url), browser = browser_name }
			end
		end
		handle:close()
	end
	return bookmarks
end

local function read_firefox_bookmarks(path, browser_name)
	local bookmarks = {}
	local escaped_path = path:gsub(" ", "%%20")
	local handle = io.popen(
		'sqlite3 -separator "|||" "file:'
			.. escaped_path
			.. '?immutable=1" "SELECT mb.title, mp.url FROM moz_bookmarks mb JOIN moz_places mp ON mb.fk = mp.id WHERE mb.type = 1 AND LENGTH(mb.title) > 0" 2>/dev/null'
	)
	if handle then
		for line in handle:lines() do
			local title, url = line:match("^(.+)|||(.+)$")
			if title and url then
				bookmarks[normalize_url(url)] = { title = trim(title), url = trim(url), browser = browser_name }
			end
		end
		handle:close()
	end
	return bookmarks
end

local function discover_browsers()
	local browsers = {}

	local handle = io.popen(
		'find ~/.config ~/.mozilla ~/.zen ~/.librewolf ~/.waterfox ~/.floorp -name "Bookmarks" -o -name "places.sqlite" 2>/dev/null'
	)
	if not handle then
		return browsers
	end

	for path in handle:lines() do
		path = trim(path)
		if path:match("/Bookmarks$") then
			local dir_name = path:match("%.config/([^/]+)/")
			if dir_name then
				local browser_name = get_chromium_browser_name(dir_name)
				table.insert(browsers, {
					name = browser_name,
					type = "chromium",
					path = path,
				})
			end
		elseif path:match("/places%.sqlite$") then
			if path:match("%.mozilla/firefox/") then
				local profile_name = path:match("%.mozilla/firefox/([^/]+)/")
				if profile_name then
					local browser_name = get_firefox_browser_name(profile_name)
					table.insert(browsers, {
						name = browser_name,
						type = "firefox",
						path = path,
					})
				end
			else
				for pattern, name in pairs(firefox_variants) do
					if path:match(pattern) then
						table.insert(browsers, {
							name = name,
							type = "firefox",
							path = path,
						})
						break
					end
				end
			end
		end
	end
	handle:close()

	return browsers
end

function GetEntries()
	local all_bookmarks = {}
	local entries = {}

	local jq_installed = is_jq_installed()
	local sqlite3_installed = is_sqlite3_installed()

	if not jq_installed then
		table.insert(entries, {
			Text = "Install jq for Chromium bookmarks",
			Subtext = "jq is required to read Chromium-based browser bookmarks.",
			Value = "",
		})
	end

	if not sqlite3_installed then
		table.insert(entries, {
			Text = "Install sqlite3 for Firefox bookmarks",
			Subtext = "sqlite3 is required to read Firefox-based browser bookmarks.",
			Value = "",
		})
	end

	local browsers = discover_browsers()

	for _, browser in ipairs(browsers) do
		local bookmarks
		if browser.type == "chromium" and jq_installed then
			bookmarks = read_chromium_bookmarks(browser.path, browser.name)
		elseif browser.type == "firefox" and sqlite3_installed then
			bookmarks = read_firefox_bookmarks(browser.path, browser.name)
		end

		if bookmarks then
			for normalized_url, bookmark in pairs(bookmarks) do
				all_bookmarks[normalized_url] = bookmark
			end
		end
	end

	for _, bookmark in pairs(all_bookmarks) do
		table.insert(entries, {
			Text = bookmark.title,
			Subtext = bookmark.browser,
			Value = bookmark.url,
			keywords = { bookmark.title, bookmark.url },
		})
	end

	table.sort(entries, function(a, b)
		return a.Text:lower() < b.Text:lower()
	end)

	if #entries == 0 then
		table.insert(entries, {
			Text = "No bookmarks found",
			Value = "",
		})
	end

	return entries
end
