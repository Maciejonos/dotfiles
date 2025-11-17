Name = "themes"
NamePretty = "Themes"
FixedOrder = true
HideFromProviderlist = true
Icon = "󰸌"
Parent = "menu"

function GetEntries()
    return {
        {
            Text = "System theme",
            Icon = "󰸌",
            Actions = {
                ["change-theme"] = "walker --theme menus -m menus:system-themes",
            },
        },
        {
            Text = "Waybar theme",
            Icon = "󰸌",
            Actions = {
                ["change-waybar"] = "walker --theme menus -m menus:waybar-themes",
            },
        },
        {
            Text = "Fastfetch theme",
            Icon = "󰸌",
            Actions = {
                ["change-fastfetch"] = "walker --theme menus -m menus:fastfetch-themes",
            },
        },
        {
            Text = "Starship theme",
            Icon = "󰸌",
            Actions = {
                ["change-starship"] = "walker --theme menus -m menus:starship-themes",
            },
        },
        {
            Text = "Cursor theme",
            Icon = "󰸌",
            Actions = {
                ["change-cursor"] = "walker --theme menus -m menus:cursor-themes",
            },
        },
    }
end
