Name = "waybar-themes"
NamePretty = "Waybar themes"
HideFromProviderlist = true
Cache = false
Parent = "themes"

function GetEntries()
	local entries = {}
	local home = os.getenv("HOME") or ""
	local themes_dir = home .. "/.config/waybar/themes"
	local style_css = home .. "/.config/waybar/style.css"
	local config_file = home .. "/.config/waybar/config"

	local dir_check = io.open(themes_dir, "r")
	if not dir_check then
		table.insert(entries, {
			Text = "Themes directory not found",
			Subtext = themes_dir,
			Value = "",
		})
		return entries
	end
	dir_check:close()

	local handle = io.popen("find '" .. themes_dir .. "' -mindepth 1 -maxdepth 1 \\( -type d -o -type l \\) | sort")
	if handle then
		for line in handle:lines() do
			local theme_name = line:match("([^/]+)$")

			if theme_name then
				local display_name = theme_name:gsub("-", " "):gsub("(%a)([%w_']*)", function(first, rest)
					return first:upper() .. rest
				end)

				local apply_cmd = ""

				local style_check = io.open(line .. "/style.css", "r")
				if style_check then
					apply_cmd = apply_cmd .. "cat '" .. line .. "/style.css' > '" .. style_css .. "'; "
					style_check:close()
				end

				local config_check = io.open(line .. "/config", "r")
				if config_check then
					apply_cmd = apply_cmd .. "cat '" .. line .. "/config' > '" .. config_file .. "'; "
					config_check:close()
				end

				apply_cmd = apply_cmd
					.. "restart-app waybar; notify-send 'Waybar Theme' 'Switched to "
					.. display_name
					.. "'"

				table.insert(entries, {
					Text = display_name,
					Value = theme_name,
					Actions = {
						apply = apply_cmd,
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
