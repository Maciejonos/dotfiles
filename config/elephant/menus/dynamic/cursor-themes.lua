Name = "cursor-themes"
NamePretty = "Cursor themes"
HideFromProviderlist = true
Cache = false
Parent = "themes"

function GetEntries()
	local entries = {}
	local home = os.getenv("HOME") or ""

	local search_dirs = {
		"/usr/share/icons",
		home .. "/.local/share/icons",
		home .. "/.icons",
	}

	local seen_themes = {}

	for _, dir in ipairs(search_dirs) do
		local find_handle = io.popen(
			"find '"
				.. dir
				.. "' -mindepth 2 -maxdepth 2 -type d -name 'cursors' 2>/dev/null | sed 's|/cursors$||' | sort"
		)

		if find_handle then
			for line in find_handle:lines() do
				local theme_name = line:match("([^/]+)$")

				if theme_name and not seen_themes[theme_name] then
					seen_themes[theme_name] = true

					local display_name = theme_name
					local comment = ""
					local index_file = line .. "/index.theme"
					local index_handle = io.popen("cat '" .. index_file .. "' 2>/dev/null")
					if index_handle then
						local content = index_handle:read("*a")
						if content then
							local name_match = content:match("Name%s*=%s*([^\n\r]+)")
							if name_match then
								display_name = name_match:gsub("^%s+", ""):gsub("%s+$", "")
							end
							local comment_match = content:match("Comment%s*=%s*([^\n\r]+)")
							if comment_match then
								comment = comment_match:gsub("^%s+", ""):gsub("%s+$", "")
							end
						end
						index_handle:close()
					end

					table.insert(entries, {
						Text = display_name,
						Subtext = comment ~= "" and comment or theme_name,
						Value = theme_name,
						Actions = {
							apply = "hyprctl setcursor '"
								.. theme_name
								.. "' 24 && notify-send 'Cursor Theme' 'Set to "
								.. display_name
								.. "'",
						},
					})
				end
			end
			find_handle:close()
		end
	end

	table.sort(entries, function(a, b)
		return a.Text < b.Text
	end)

	if #entries == 0 then
		table.insert(entries, {
			Text = "No cursor themes found",
			Subtext = "Check /usr/share/icons or ~/.local/share/icons",
			Value = "",
		})
	end

	return entries
end
