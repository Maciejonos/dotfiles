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
			Actions = {
				["area_clipboard"] = "grim -g \"$(slurp)\" - | wl-copy && notify-send 'Copied Area'",
			},
		},
		{
			Text = "Area → File",
			Actions = {
				["area_file"] = "grim -g \"$(slurp)\" ~/Pictures/$(date +%Y-%m-%d_%H-%M-%S).png && notify-send 'Saved Screenshot'",
			},
		},
		{
			Text = "Window → Clipboard",
			Actions = {
				["window_clipboard"] = "grim -g \"$(hyprctl -j clients | jq -r '.[] | \"\\(.at[0]),\\(.at[1]) \\(.size[0])x\\(.size[1])\"' | slurp -r)\" - | wl-copy && notify-send 'Copied Window'",
			},
		},
		{
			Text = "Window → File",
			Actions = {
				["window_file"] = "grim -g \"$(hyprctl -j clients | jq -r '.[] | \"\\(.at[0]),\\(.at[1]) \\(.size[0])x\\(.size[1])\"' | slurp -r)\" ~/Pictures/$(date +%Y-%m-%d_%H-%M-%S).png && notify-send 'Saved Window'",
			},
		},
		{
			Text = "Fullscreen → Clipboard",
			Actions = {
				["fullscreen_clipboard"] = "grim - | wl-copy && notify-send 'Copied Fullscreen'",
			},
		},
		{
			Text = "Fullscreen → File",
			Actions = {
				["fullscreen_file"] = "grim ~/Pictures/$(date +%Y-%m-%d_%H-%M-%S).png && notify-send 'Saved Fullscreen'",
			},
		},
	}
end
