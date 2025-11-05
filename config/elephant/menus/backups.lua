Name = "backups"
NamePretty = "Backups"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "tools"

function GetEntries()
	return {
		{
			Text = "Archive files",
			Icon = "",
			Actions = {
				["backup-files"] = "ghostty --class=local.floating -e backup-files",
			},
		},
		{
			Text = "Unpack archive",
			Icon = "",
			Actions = {
				["backup-restore"] = "ghostty --class=local.floating -e backup-restore",
			},
		},
	}
end
