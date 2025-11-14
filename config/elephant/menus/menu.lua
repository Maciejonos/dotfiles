Name = "menu"
NamePretty = "Menu"
FixedOrder = true
HideFromProviderlist = true
Description = "Menu"

function GetEntries()
	return {
		{
			Text = "Update",
			Icon = "",
			Actions = {
				["update"] = "ghostty --class=local.floating -e update-perform",
			},
		},
		{
			Text = "Install package",
			Icon = "󰣇",
			Actions = {
				["manage-pkg"] = "ghostty --class=local.floating -e pkg-install",
			},
		},
		{
			Text = "Remove package",
			Icon = "󰭌",
			Actions = {
				["manage-pkg"] = "ghostty --class=local.floating -e pkg-remove",
			},
		},
		{
			Text = "Change themes",
			Icon = "󰸌",
			Actions = {
				["change-themes"] = "walker -t menus -m menus:themes",
			},
		},
		{
			Text = "Next background",
			Icon = "",
			Actions = {
				["change-bg"] = "theme-bg-next",
			},
		},
		{
			Text = "Capture",
			Icon = "",
			Actions = {
				["capture"] = "walker -t menus -m menus:capture",
			},
		},
		{
			Text = "Setup",
			Icon = "󰉉",
			Actions = {
				["setup"] = "walker -t menus -m menus:setup",
			},
		},
		{
			Text = "Tools",
			Icon = "",
			Actions = {
				["tools"] = "walker -t menus -m menus:tools",
			},
		},
		{
			Text = "Keybindings",
			Icon = "",
			Actions = {
				["keybindings"] = "walker -t menus -m menus:keybindings",
			},
		},
		{
			Text = "System",
			Icon = "󰐥",
			Actions = {
				["system"] = "walker -t menus -m menus:system",
			},
		},
	}
end
