Name = "capture"
NamePretty = "Capture"
FixedOrder = true
HideFromProviderlist = true
Icon = ""
Parent = "menu"

function GetEntries()
    return {
        {
            Text = "Screenshot",
            Icon = "",
            Actions = {
                ["screenshot"] = "walker --theme menus -m menus:screenshots",
            },
        },
        {
            Text = "Record",
            Icon = "",
            Actions = {
                ["record"] = "kooha",
            },
        },
    }
end
