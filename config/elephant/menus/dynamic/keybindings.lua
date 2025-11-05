Name = "keybindings"
NamePretty = "Keybindings"
HideFromProviderlist = true
Cache = false
Parent = "menu"

function GetEntries()
	local entries = {}
	local home = os.getenv("HOME") or ""
	local hypr_config = home .. "/.config/hypr/hyprland.conf"

	local config_file_handle =
		io.popen("grep -E 'source.*keybindings\\.conf' '" .. hypr_config .. "' | awk '{print $3}' 2>/dev/null")
	local config_file = ""
	if config_file_handle then
		config_file = config_file_handle:read("*l") or ""
		config_file_handle:close()
	end

	if config_file and config_file ~= "" then
		config_file = config_file:gsub("^~", home)
	end

	if config_file == "" or config_file == nil then
		config_file = home .. "/.local/share/dotfiles/default/hypr/conf/desktop-keybindings.conf"
	end

	local test_file = io.open(config_file, "r")
	if not test_file then
		table.insert(entries, {
			Text = "Error: Keybindings file not found",
			Subtext = config_file,
			Value = "",
		})
		return entries
	end
	test_file:close()

	local file = io.open(config_file, "r")
	if not file then
		return entries
	end

	local mainMod = "SUPER"
	local terminal = "ghostty"

	for line in file:lines() do
		if line:match("^%$mainMod") then
			local value = line:match("=%s*(.+)$")
			if value then
				local trimmed = value:match("^%s*(.-)%s*$")
				if trimmed then
					mainMod = trimmed
				end
			end
		elseif line:match("^%$terminal") then
			local value = line:match("=%s*(.+)$")
			if value then
				local trimmed = value:match("^%s*(.-)%s*$")
				if trimmed then
					terminal = trimmed
				end
			end
		end

		local bind_match = line:match("^(bind[em]?%s*=.-)%s*#%s*(.+)$")
		if bind_match then
			local binding, desc = line:match("^bind[em]?%s*=%s*(.-)%s*#%s*(.+)$")
			if binding and desc then
				desc = desc:match("^%s*(.-)%s*$")

				if desc ~= "" then
					local parts = {}
					for part in binding:gmatch("([^,]+)") do
						table.insert(parts, part:match("^%s*(.-)%s*$"))
					end

					if #parts >= 2 then
						local mods = parts[1]
						local key = parts[2]

						mods = mods:gsub("%$mainMod", mainMod)
						key = key:gsub("%$terminal", terminal)

						local key_combo
						if mods == "" or mods == " " then
							key_combo = key
						else
							key_combo = mods .. " + " .. key
						end

						local padding = 35 - #key_combo
						if padding < 1 then
							padding = 1
						end
						local padded_combo = key_combo .. string.rep(" ", padding)

						local display_text = padded_combo .. "→ " .. desc

						table.insert(entries, {
							Text = display_text,
							Value = key_combo .. " → " .. desc,
							Actions = {
								copy = "echo '"
									.. key_combo
									.. "' | wl-copy && notify-send 'Copied' '"
									.. key_combo
									.. "'",
							},
						})
					end
				end
			end
		end
	end

	file:close()

	if #entries == 0 then
		table.insert(entries, {
			Text = "No keybindings found",
			Subtext = "Check your Hyprland config",
			Value = "",
		})
	end

	return entries
end
