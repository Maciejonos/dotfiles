Name = "setup"
NamePretty = "Setup"
FixedOrder = true
HideFromProviderlist = true
Icon = "󰉉"
Parent = "menu"

function GetEntries()
    return {
        {
            Text = "Postgres",
            Icon = "",
            Actions = {
                ["postgres"] = "walker --theme menus -m menus:postgres",
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
