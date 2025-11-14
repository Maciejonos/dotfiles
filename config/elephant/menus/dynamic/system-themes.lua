Name = "system-themes"
NamePretty = "System themes"
HideFromProviderlist = true
Cache = false
Parent = "themes"

function GetEntries()
	local entries = {}
	local home = os.getenv("HOME") or ""
	local themes_dir = home .. "/.local/share/dotfiles/themes"
	local current_theme_link = home .. "/.local/share/dotfiles/current/theme"

	local current_handle = io.popen("basename $(readlink '" .. current_theme_link .. "' 2>/dev/null) 2>/dev/null")
	local current_theme = ""
	if current_handle then
		current_theme = current_handle:read("*l") or ""
		current_handle:close()
	end

	local handle = io.popen(
		"find '" .. themes_dir .. "' -mindepth 1 -maxdepth 1 \\( -type d -o -type l \\) ! -name 'backgrounds' | sort"
	)
	if handle then
		for line in handle:lines() do
			local theme_name = line:match("([^/]+)$")

			if theme_name then
				local display_name = theme_name:gsub("-", " "):gsub("(%a)([%w_']*)", function(first, rest)
					return first:upper() .. rest
				end)

				local is_dynamic = (theme_name == "tinte" or theme_name == "matugen")
				local is_current = (theme_name == current_theme)
				local prefix = is_current and "* " or ""

				table.insert(entries, {
					Text = prefix .. display_name,
					Subtext = is_dynamic and "Dynamic" or "Static",
					Value = display_name,
					state = is_current and { "current" } or nil,
					Actions = {
						apply = "theme-set '" .. display_name .. "'",
					},
				})
			end
		end
		handle:close()
	end

	if #entries == 0 then
		table.insert(entries, {
			Text = "No themes found",
			Subtext = "Check " .. themes_dir,
			Value = "",
		})
	end

	return entries
end
