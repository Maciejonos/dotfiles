Name = "screenrecord"
NamePretty = "Screenrecord"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "capture"

function GetEntries()
	return {
		{
			Text = "Region",
			Actions = {
				["region"] = "screenrecord",
			},
		},
		{
			Text = "Region + Audio",
			Actions = {
				["region_audio"] = "screenrecord region --with-audio",
			},
		},
		{
			Text = "Display",
			Actions = {
				["display"] = "screenrecord output",
			},
		},
		{
			Text = "Display + Audio",
			Actions = {
				["display_audio"] = "screenrecord output --with-audio",
			},
		},
		{
			Text = "Display + Webcam",
			Actions = {
				["display_webcam"] = "screenrecord output --with-audio --with-webcam",
			},
		},
	}
end
