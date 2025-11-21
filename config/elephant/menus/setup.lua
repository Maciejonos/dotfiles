Name = "setup"
NamePretty = "Setup"
FixedOrder = true
HideFromProviderlist = true
Icon = "󰉉"
Parent = "menu"

function GetEntries()
	return {
		{
			Text = "Fingerprint",
			Icon = "",
			Actions = {
				["fingerprint"] = "ghostty --class=local.floating -e fingerprint-setup",
			},
		},
		{
			Text = "Postgres",
			Icon = "",
			Actions = {
				["postgres"] = "walker --theme menus -m menus:postgres -N",
			},
		},
		{
			Text = "Docker",
			Icon = "",
			Actions = {
				["docker"] = "ghostty --class=local.floating -e docker-setup",
			},
		},
		{
			Text = "Node.js",
			Icon = "",
			Actions = {
				["nodejs"] = "ghostty --class=local.floating -e nodejs-setup",
			},
		},
	}
end
