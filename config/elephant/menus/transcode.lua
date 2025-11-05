Name = "transcode"
NamePretty = "Transcode"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "tools"

function GetEntries()
	return {
		{
			Text = "Transcode video",
			Icon = "",
			Actions = {
				["transcode-video"] = "ghostty --class=local.floating -e transcode-video",
			},
		},
		{
			Text = "Transcode image",
			Icon = "",
			Actions = {
				["transcode-image"] = "ghostty --class=local.floating -e transcode-image",
			},
		},
	}
end
