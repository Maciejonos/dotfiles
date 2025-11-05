Name = "postgres"
NamePretty = "Postgres"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "tools"

function GetEntries()
	return {
		{
			Text = "Setup postgres",
			Icon = "",
			Actions = {
				["postgres-setup"] = "ghostty --class=local.floating -e postgres-setup",
			},
		},
		{
			Text = "Restore database",
			Icon = "",
			Actions = {
				["postgres-restore-db"] = "ghostty --class=local.floating -e postgres-restore-db",
			},
		},
		{
			Text = "Backup database",
			Icon = "",
			Actions = {
				["postgres-backup"] = "ghostty --class=local.floating -e postgres-backup",
			},
		},
	}
end
