Name = "tools"
NamePretty = "tools"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "menu"

function GetEntries()
	return {
		{
			Text = "OCR",
			Icon = "",
			Actions = {
				["OCR"] = [[grim -g "$(slurp)" - | tesseract stdin stdout -l eng | wl-copy]],
			},
		},
		{
			Text = "Ollama",
			Icon = "",
			Actions = {
				["ollama"] = "walker --theme menus -m menus:ollama",
			},
		},
		{
			Text = "Download video",
			Icon = "",
			Actions = {
				["download-video"] = "ghostty --class=local.floating -e media-download",
			},
		},
		{
			Text = "Transcode",
			Icon = "",
			Actions = {
				["transcode"] = "walker --theme menus -m menus:transcode",
			},
		},
		{
			Text = "ISO to usb",
			Icon = "",
			Actions = {
				["write-iso"] = "ghostty --class=local.floating -e write-iso",
			},
		},
		{
			Text = "Backups",
			Icon = "",
			Actions = {
				["backups"] = "walker --theme menus -m menus:backups",
			},
		},
		{
			Text = "Add a webapp",
			Icon = "",
			Actions = {
				["webapp-install"] = "ghostty --class=local.floating -e webapp-install",
			},
		},
	}
end
