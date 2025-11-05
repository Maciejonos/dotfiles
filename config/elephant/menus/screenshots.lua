Name = "screenshots"
NamePretty = "Screenshots"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "capture"

function GetEntries()
	return {
		{
			Text = "Area → Clipboard",
			Icon = "",
			Actions = {
				["area_clipboard"] = "hyprshot -m region --clipboard-only && notify-send 'Copied Area'",
			},
		},
		{
			Text = "Area → File",
			Icon = "",
			Actions = {
				["area_file"] = "hyprshot -m region",
			},
		},
		{
			Text = "Window → Clipboard",
			Icon = "",
			Actions = {
				["window_clipboard"] = "hyprshot -m window --clipboard-only && notify-send 'Copied Window'",
			},
		},
		{
			Text = "Window → File",
			Icon = "",
			Actions = {
				["window_file"] = "hyprshot -m window",
			},
		},
		{
			Text = "Fullscreen → Clipboard",
			Icon = "",
			Actions = {
				["fullscreen_clipboard"] = "hyprshot -m output --clipboard-only && notify-send 'Copied Fullscreen'",
			},
		},
		{
			Text = "Fullscreen → File",
			Icon = "",
			Actions = {
				["fullscreen_file"] = "hyprshot -m output",
			},
		},
	}
end
