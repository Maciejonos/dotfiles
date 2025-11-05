Name = "starship-themes"
NamePretty = "Starship themes"
HideFromProviderlist = true
Cache = false
Parent = "themes"

function GetEntries()
	local entries = {}
	local home = os.getenv("HOME") or ""
	local configs_dir = home .. "/.config/starship/configs"
	local config_link = home .. "/.config/starship.toml"

	local dir_check = io.open(configs_dir, "r")
	if not dir_check then
		table.insert(entries, {
			Text = "Configs directory not found",
			Subtext = configs_dir,
			Value = "",
		})
		return entries
	end
	dir_check:close()

	local current_handle = io.popen("basename $(readlink '" .. config_link .. "' 2>/dev/null) .toml 2>/dev/null")
	local current_config = ""
	if current_handle then
		current_config = current_handle:read("*l") or ""
		current_handle:close()
	end

	local handle = io.popen("find '" .. configs_dir .. "' -mindepth 1 -maxdepth 1 -type f -name '*.toml' | sort")
	if handle then
		for line in handle:lines() do
			local filename = line:match("([^/]+)$")
			if filename then
				local config_name = filename:gsub("%.toml$", "")

				local display_name = config_name
					:gsub("^config%-", "")
					:gsub("-", " ")
					:gsub("(%a)([%w_']*)", function(first, rest)
						return first:upper() .. rest
					end)

				local is_current = (config_name == current_config)
				local prefix = is_current and "* " or ""

				table.insert(entries, {
					Text = prefix .. display_name,
					Value = config_name,
					state = is_current and { "current" } or nil,
					Actions = {
						apply = "rm -f '"
							.. config_link
							.. "' && ln -s '"
							.. line
							.. "' '"
							.. config_link
							.. "' && notify-send 'Starship Config' 'Switched to "
							.. display_name
							.. "'",
					},
				})
			end
		end
		handle:close()
	end

	if #entries == 0 then
		table.insert(entries, {
			Text = "No configs found",
			Subtext = "Check " .. configs_dir,
			Value = "",
		})
	end

	return entries
end
