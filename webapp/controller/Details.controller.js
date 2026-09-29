sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/m/MessageToast',
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "com/ssmc/createordexcptnsom/model/formatter",
    "sap/ui/export/Spreadsheet"
], (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, formatter, Spreadsheet) => {
    "use strict";
    return Controller.extend("com.ssmc.createordexcptnsom.controller.Details", {
        formatter: formatter,
        onInit() {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.getRoute("Details").attachPatternMatched(this._oRouteMatched, this);
        },
        _oRouteMatched: function (oEvent) {
            var oaExcNum = oEvent.getParameter("arguments").oaExcNum;
            var rqstType = oEvent.getParameter("arguments").rqstType;
            this._excelDownloadSnapshot = null;
            this.getView().byId("rqstTypeDetails").setSelectedKey(rqstType === "PO" ? "PO" : rqstType);
            var viewRqstModel = new JSONModel({
                vendorType : false,
                poType : false,
                footerBtns: false
            });
            this.getView().setModel(viewRqstModel, "viewRqstModel");
            if(rqstType === "Vendor"){
                this.getView().getModel("viewRqstModel").setProperty("/vendorType", true);
                this.getView().getModel("viewRqstModel").setProperty("/poType", false);
                this.getView().getModel("viewRqstModel").setProperty("/footerBtns", true);
                this.getVendorDetails(oaExcNum);
            } else if(rqstType === "PO"){
                this.getView().getModel("viewRqstModel").setProperty("/vendorType", false);
                this.getView().getModel("viewRqstModel").setProperty("/poType", true);
                this.getView().getModel("viewRqstModel").setProperty("/footerBtns", true);
                this.getPODetails(oaExcNum);
            } else{
                this.getView().getModel("viewRqstModel").setProperty("/vendorType", false);
                this.getView().getModel("viewRqstModel").setProperty("/poType", false);
                this.getView().getModel("viewRqstModel").setProperty("/footerBtns", false);
            }
            //this.getDetails(poNum, supplier);
        },
        getVendorDetails: function (oaExcNum) {
            sap.ui.core.BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel();
            var aFilters = [
                new Filter("YyoaExpReqNo", FilterOperator.EQ, oaExcNum || "")
            ];
            var oFilter = new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            });
            oModel.read("/ExceptionByVendorSet", {
                filters: [oFilter],
                urlParameters: {
                    "$expand": "ExceptionByVendorToAttachNav"
                },
                success: function (res) {
                    if (res.results.length !== 0) {
                        // if (res.results[0].YyoaAckStatus === "" || res.results[0].YyoaAckStatus === "Resent OA to Supplier") {
                        //     this.getView().getModel("editableModel").setProperty("/allowEdit", true);
                        //     if (res.results[0].YyoaAckStatus === "Resent OA to Supplier") {
                        //         this.getView().getModel("editableModel").setProperty("/allowRejcomm", true);
                        //     }
                        // } else {
                        //     this.getView().getModel("editableModel").setProperty("/allowEdit", false);
                        //     this.getView().getModel("editableModel").setProperty("/allowRejcomm", false);
                        // }
                        var oLocalDataModel = new JSONModel(res.results[0]);
                        this.getView().setModel(oLocalDataModel, "LocalDataModel");
                        this.getView().getModel("LocalDataModel").setProperty("/AttachmentSet", res.results[0].ExceptionByVendorToAttachNav?.results.map(item => {
                            return {
                                Filename: item.YyfileName,
                                Content: item.Yyattachment,
                                Mimetype: item.Yyattachment.split(",")[0].split("data:")[1].split(";base64")[0],
                                YyattchId: item.YyattchId || ""
                            };
                        }) || []);
                        // var oDetailsTableModel = new JSONModel(res.results[0].OAHeaderToItemNav.results);
                        // this.getView().setModel(oDetailsTableModel, "detailsTableModel");
                    } else {
                        var oLocalDataModel = new JSONModel({});
                        this.getView().setModel(oLocalDataModel, "LocalDataModel");
                        this.getView().setModel(new JSONModel([]), "detailsTableModel");
                    }
                    sap.ui.core.BusyIndicator.hide();
                }.bind(this),
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    // MessageBox.error(JSON.parse(err.responseText).error.message.value);
                    if (oError.statusCode === 403 || oError.statusCode === "403") {
                        const xmlString = oError.responseText;
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                        const itemText = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                        MessageBox.error(itemText + " - " + oError.statusText);
                    }
                    else {
                        try {
                            if (oError.responseText) {
                                var errorResponse = JSON.parse(oError.responseText);
                                var errorMessage = errorResponse.error?.message?.value || errorResponse.error?.message || "An unknown error occurred";
                                MessageBox.error(errorMessage);
                            } else {
                                MessageBox.error("An unknown error occurred");
                            }
                        } catch (e) {
                            MessageBox.error(oError.message || "An unknown error occurred");
                        }
                    }
                }.bind(this)
            });
        },
        getPODetails: function (oaExcNum) {
            sap.ui.core.BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel();
            var aFilters = [
                new Filter("YyoaExpReqNo", FilterOperator.EQ, oaExcNum || "")
            ];
            oModel.read("/ExceptionByPOHeaderSet", {
                filters: aFilters,
                urlParameters: {
                    "$expand": "ExceptionByPOHeaderToItemNav,ExceptionByPOHeaderToAttachNav"
                },
                success: function (res) {
                    if (res.results.length !== 0) {
                        var oLocalDataModel = new JSONModel(res.results[0]);
                        this.getView().setModel(oLocalDataModel, "LocalDataModel");
                        if (res.results[0].YypoNum !== "") {
                            var valuesArray = res.results[0].YypoNum.split(',');
                            var oMultiInput = this.byId("podtlId");
                            oMultiInput.removeAllTokens();
                            valuesArray.forEach(function (value) {
                                oMultiInput.addToken(new sap.m.Token({ text: value.trim() }));
                            });
                        }
                        this.getView().getModel("LocalDataModel").setProperty("/AttachmentSet", res.results[0].ExceptionByPOHeaderToAttachNav?.results.map(item => {
                            return {
                                Filename: item.YyfileName,
                                Content: item.Yyattachment,
                                Mimetype: item.Yyattachment.split(",")[0].split("data:")[1].split(";base64")[0],
                                YyattchId: item.YyattchId || ""
                            };
                        }) || []);
                        var oDetailsTableModel = new JSONModel(res.results[0].ExceptionByPOHeaderToItemNav.results);
                        this.getView().setModel(oDetailsTableModel, "poDetailsModel");
                    } else {
                        var oLocalDataModel = new JSONModel({});
                        this.getView().setModel(oLocalDataModel, "LocalDataModel");
                        this.getView().setModel(new JSONModel([]), "poDetailsModel");
                        //this.getView().setModel(new JSONModel([]), "detailsTableModel");
                    }
                    sap.ui.core.BusyIndicator.hide();
                }.bind(this),
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    // MessageBox.error(JSON.parse(err.responseText).error.message.value);
                    if (oError.statusCode === 403 || oError.statusCode === "403") {
                        const xmlString = oError.responseText;
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                        const itemText = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                        MessageBox.error(itemText + " - " + oError.statusText);
                    }
                    else {
                        try {
                            if (oError.responseText) {
                                var errorResponse = JSON.parse(oError.responseText);
                                var errorMessage = errorResponse.error?.message?.value || errorResponse.error?.message || "An unknown error occurred";
                                MessageBox.error(errorMessage);
                            } else {
                                MessageBox.error("An unknown error occurred");
                            }
                        } catch (e) {
                            MessageBox.error(oError.message || "An unknown error occurred");
                        }
                    }
                }.bind(this)
            });
        },
        onPreviewAttachment: function (oEvent) {
            if (this.requestType === "Vendor") {
                var sPath = oEvent.getSource().getBindingContext("LocalDataModel").getPath();
                var oSelectedFile = oEvent.getSource().getBindingContext("LocalDataModel").getProperty(sPath);
                var sFileName = oSelectedFile.Filename || "Attachment";
                var sExtension = oSelectedFile.Content.split(",")[0].split(";")[0].split(":")[1] ? oSelectedFile.Content.split(",")[0].split(";")[0].split(":")[1] : "";
                if (!sExtension) {
                    var oBundle = this.getView().getModel("i18n").getResourceBundle();
                    MessageBox.show("File extension not found.");
                    return;
                }
                var sBase64 = oSelectedFile.Content;
            } else if (this.requestType === "PO") {
                var sPath = oEvent.getSource().getBindingContext("LocalDataModel").getPath();
                var oSelectedFile = oEvent.getSource().getBindingContext("LocalDataModel").getProperty(sPath);
                var sFileName = oSelectedFile.Filename || "Attachment";
                var sExtension = oSelectedFile.Content.split(",")[0].split(";")[0].split(":")[1] ? oSelectedFile.Content.split(",")[0].split(";")[0].split(":")[1] : "";
                if (!sExtension) {
                    var oBundle = this.getView().getModel("i18n").getResourceBundle();
                    MessageBox.show("File extension not found.");
                    return;
                }
                var sBase64 = oSelectedFile.Content;
            }
            if (!sBase64) {
                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                MessageBox.show("No file content found.");
                return;
            }

            var base64Data = sBase64.includes(",") ? sBase64.split(",")[1] : sBase64;

            var byteCharacters = atob(base64Data);
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            var blob = new Blob([byteArray], { type: sExtension });
            var objectUrl = URL.createObjectURL(blob);

            var features = "width=950vw,height=850vh,resizable=yes,scrollbars=yes,toolbar=yes,menubar=yes,location=yes";


            if (sExtension.includes("image/") || sExtension.includes("pdf") || sExtension.includes("text/plain")) {
                window.open(objectUrl, "_blank", features);
            }
            else {
                var oLink = document.createElement("a");
                oLink.style.display = "none";
                oLink.href = objectUrl;
                oLink.download = sFileName; // Target filename

                // 4. Append, click, and clean up the DOM
                document.body.appendChild(oLink);
                oLink.click();

                document.body.removeChild(oLink);
                //window.open(objectUrl);
            }

            setTimeout(function () {
                URL.revokeObjectURL(objectUrl);
            }, 5000);

        },
        onDownload: function (oEvent) {
            var oItem = oEvent.getSource().getBindingContext("LocalDataModel").getObject();

            var sFileName = oItem.Filename;
            var sFileUrl = oItem.Content;
            if (sFileUrl.length < 1) {
                MessageBox.error("No attachment data found for download.");
            }

            var oLink = document.createElement("a");
            oLink.href = sFileUrl;
            oLink.download = sFileName;
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);

        },
    });
});