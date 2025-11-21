Name = "capture"
NamePretty = "Capture"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "menu"

function GetEntries()
	return {
		{
			Text = "Screenshot",
			Icon = "",
			Actions = {
				["screenshot"] = "walker -t menus -m menus:screenshots -N",
			},
		},
		{
			Text = "Record",
			Icon = "",
			Actions = {
				["record"] = "walker -t menus -m menus:screenrecord -N",
			},
		},
	}
end
