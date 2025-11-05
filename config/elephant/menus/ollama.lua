Name = "ollama"
NamePretty = "Ollama"
FixedOrder = true
HideFromProviderlist = true
Parent = "tools"

function GetEntries()
	return {
		{
			Text = "Chat",
			Actions = {
				["chat"] = "ghostty --class=local.floating -e ollama-chat --chat",
			},
		},
		{
			Text = "Select default model",
			Actions = {
				["select-default"] = "ghostty --class=local.floating -e ollama-chat --select",
			},
		},
		{
			Text = "List models",
			Actions = {
				["list-models"] = "ghostty --class=local.floating -e ollama-chat --list",
			},
		},
		{
			Text = "Pull model",
			Actions = {
				["pull-model"] = "ghostty --class=local.floating -e ollama-chat --pull",
			},
		},
		{
			Text = "Remove model",
			Actions = {
				["remove-model"] = "ghostty --class=local.floating -e ollama-chat --rm",
			},
		},
		{
			Text = "Install Ollama",
			Actions = {
				["install"] = "ghostty --class=local.floating -e ollama-chat --install",
			},
		},
	}
end
