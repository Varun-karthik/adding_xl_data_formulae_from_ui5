sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/ssmc/createordexcptnsom/model/models",
    "sap/ui/model/json/JSONModel"
], (UIComponent, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("com.ssmc.createordexcptnsom.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
             var oModel = new JSONModel();
            this.setModel(oModel, "globalModel");

            // enable routing
            this.getRouter().initialize();
             this.getLoggedInUser();
        },
        getLoggedInUser: function () {
            var useremail;
            if (sap.ushell && sap.ushell.Container) {
                var oUserInfo = sap.ushell.Container.getService("UserInfo");
                var sUser = oUserInfo.getUser().getEmail();
                console.log("Logged-in sUser     ", sUser);
                if (sUser) {
                    useremail = sUser;
                } else {
                    useremail = "Saniya.Shaikh@yash.com";
                    // useremail = "test@ssmc.com";
                    // useremail = "zeon.sg@gmail.com";
                    // useremail="zeon.lee@ssmc.com";
                }
            } else {
                //    useremail = "nick123@gmail.com"; 
                // useremail="harry123@gmail.com"  
                //    useremail = "it.ayush.rathod@ssmc.com";  
                //    useremail="ron123@gmail.com";
                // useremail="DAFEI@SSMC.COM"
            }
            this.getModel("globalModel").setProperty("/loggedInEmail", useremail);
        }
    });
});