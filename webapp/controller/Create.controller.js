sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/m/MessageToast',
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "com/ssmc/createordexcptnsom/model/formatter",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment"
], (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, formatter, Spreadsheet, Fragment) => {
    "use strict";
    return Controller.extend("com.ssmc.createordexcptnsom.controller.Create", {
        formatter: formatter,
        onInit() {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.getRoute("Create").attachPatternMatched(this._oRouteMatched, this);
        },
        _oRouteMatched: function (oEvent) {
            var oaExcNum = oEvent.getParameter("arguments").oaExcNum;
            var rqstType = oEvent.getParameter("arguments").rqstType;
            var status = oEvent.getParameter("arguments").status;
            this._excelDownloadSnapshot = null;
            this.getView().byId("rqstType").setEditable(true);
            this.getView().byId("rqstType").setSelectedKey();
            var viewRqstModel = new JSONModel({
                vendorType: false,
                poType: false,
                footerBtns: false
            });
            this.getView().setModel(viewRqstModel, "viewRqstModel");
            var oLocalModel = new JSONModel({ AttachmentSet: [] });
            this.getView().setModel(oLocalModel, "LocalDataModel");
            var oDetailsTableModel = new JSONModel([]);
            this.getView().setModel(oDetailsTableModel, "poDetailsModel");
            this.readVendors();
            if (status === "Draft") {
                this.requestType = rqstType;
                this.getView().byId("rqstType").setEditable(false);
                this.getView().byId("rqstType").setSelectedKey(rqstType);
                if (rqstType === "Vendor") {
                    this.getView().getModel("viewRqstModel").setProperty("/vendorType", true);
                    this.getView().getModel("viewRqstModel").setProperty("/poType", false);
                    this.getView().getModel("viewRqstModel").setProperty("/footerBtns", true);
                    this.getVendorDetails(oaExcNum);
                } else if (rqstType === "PO") {
                    this.getView().getModel("viewRqstModel").setProperty("/vendorType", false);
                    this.getView().getModel("viewRqstModel").setProperty("/poType", true);
                    this.getView().getModel("viewRqstModel").setProperty("/footerBtns", true);
                    this.readPO();
                    this.getPODetails(oaExcNum);
                } else {
                    this.getView().getModel("viewRqstModel").setProperty("/vendorType", false);
                    this.getView().getModel("viewRqstModel").setProperty("/poType", false);
                    this.getView().getModel("viewRqstModel").setProperty("/footerBtns", false);
                }
            }

            //this.getDetails(poNum, supplier);
        },
        readVendors: function () {
            sap.ui.core.BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/VendorDropdownSet", {
                success: function (res) {
                    if (res.results.length !== 0) {
                        var oVendorsModel = new JSONModel(res.results);
                        this.getView().setModel(oVendorsModel, "vendorsModel");
                    } else {
                        var oVendorsModel = new JSONModel({});
                        this.getView().setModel(oVendorsModel, "vendorsModel");
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
        readPO: function () {
            sap.ui.core.BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/PODropdownSet", {
                success: function (res) {
                    if (res.results.length !== 0) {
                        var oPOModel = new JSONModel(res.results);
                        this.getView().setModel(oPOModel, "poModel");
                    } else {
                        var oPOModel = new JSONModel({});
                        this.getView().setModel(oPOModel, "poModel");
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
        readPODetails: function (selectedPO) {
            sap.ui.core.BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel();
            var aFilters = [
                new Filter("YypoNumStr", FilterOperator.EQ, selectedPO || "")
            ];

            oModel.read("/ExceptionByPOItemSet", {
                filters: aFilters,
                success: function (res) {
                    if (res.results.length !== 0) {
                        var oPODetailsModel = new JSONModel(res.results);
                        this.getView().setModel(oPODetailsModel, "poDetailsModel");
                    } else {
                        var oPODetailsModel = new JSONModel({});
                        this.getView().setModel(oPODetailsModel, "poDetailsModel");
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
        onRqstTypeSelect: function (oEvent) {
            var selectedItem = oEvent.getSource().getSelectedKey();
            this.requestType = selectedItem;
            var oLocalModel = new JSONModel({ AttachmentSet: [] });
            this.getView().setModel(oLocalModel, "LocalDataModel");
            if (selectedItem === "Vendor") {
                this.getView().getModel("viewRqstModel").setProperty("/vendorType", true);
                this.getView().getModel("viewRqstModel").setProperty("/poType", false);
                this.getView().getModel("viewRqstModel").setProperty("/footerBtns", true);
            } else if (selectedItem === "PO") {
                this.getView().getModel("viewRqstModel").setProperty("/vendorType", false);
                this.getView().getModel("viewRqstModel").setProperty("/poType", true);
                this.getView().getModel("viewRqstModel").setProperty("/footerBtns", true);
                var oMultiInput = this.byId("poId");
                oMultiInput.removeAllTokens();
                this.readPO();
            } else {
                this.getView().getModel("viewRqstModel").setProperty("/vendorType", false);
                this.getView().getModel("viewRqstModel").setProperty("/poType", false);
                this.getView().getModel("viewRqstModel").setProperty("/footerBtns", false);
            }
        },
        getVendorDetails: function (oaExcNum) {
            sap.ui.core.BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel();
            var aFilters = [
                new Filter("YyoaExpReqNo", FilterOperator.EQ, oaExcNum || "")
            ];
            // var oFilter = new sap.ui.model.Filter({
            //     filters: aFilters,
            //     and: true
            // });
            oModel.read("/ExceptionByVendorSet", {
                filters: aFilters,
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
                            var oMultiInput = this.byId("poId");
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
        onUploadCompleted: function () {
            MessageToast.show("Attachment Added");
        },
        onUploadVendorCode: function (oEvent) {
            var that = this;
            var aFiles = oEvent.getParameter("files");
            var oModel = this.getView().getModel("LocalDataModel");
            var aAttachments = oModel.getProperty("/AttachmentSet") || [];

            // if (aFiles.length > 0) {
            //     var file = aFiles[0];
            for (var i = 0; i < aFiles.length; i++) {
                var file = aFiles[i];
                var reader = new FileReader();
                reader.onload = (function (file) {
                    return function (e) {
                        aAttachments.push({
                            Filename: file.name,
                            Mimetype: file.type,
                            Content: e.target.result,
                            Documentsize: file.size,

                        });
                        oModel.setProperty("/AttachmentSet", aAttachments);
                        var fileUploader = that.getView().byId("venCodeAttachmentID");
                        fileUploader.setValue("");
                    };
                })(file);
                reader.readAsDataURL(file); // Read file as Base64
            }
            this.onUploadCompleted();
        },
        onUploadpoAttachment: function (oEvent) {
            var that = this;
            var aFiles = oEvent.getParameter("files");
            var oModel = this.getView().getModel("LocalDataModel");
            var aAttachments = oModel.getProperty("/AttachmentSet") || [];

            // if (aFiles.length > 0) {
            //     var file = aFiles[0];
            for (var i = 0; i < aFiles.length; i++) {
                var file = aFiles[i];
                var reader = new FileReader();
                reader.onload = (function (file) {
                    return function (e) {
                        aAttachments.push({
                            Filename: file.name,
                            Mimetype: file.type,
                            Content: e.target.result,
                            Documentsize: file.size,

                        });
                        oModel.setProperty("/AttachmentSet", aAttachments);
                        var fileUploader = that.getView().byId("poAttachmentID");
                        fileUploader.setValue("");
                    };
                })(file);
                reader.readAsDataURL(file); // Read file as Base64
            }
            this.onUploadCompleted();
        },
        onDeleteAttach: function (oEvent) {
            var oModel = this.getView().getModel("LocalDataModel");
            var sPath = oEvent.getParameter("listItem").getBindingContext("LocalDataModel").getPath();
            var aAttachments = oModel.getProperty("/AttachmentSet");
            // Get the index of the item to delete
            var iIndex = parseInt(sPath.split("/").pop());
            // Remove the item from the array
            aAttachments.splice(iIndex, 1);
            // Update model to reflect changes in the table
            oModel.setProperty("/AttachmentSet", aAttachments);
            MessageToast.show("File Deleted Successfully");
        },
        onVendorValueHelp: function (oEvent) {
            sap.ui.core.BusyIndicator.show(0);
            var sInputValue = oEvent.getSource().getValue(),
                oView = this.getView();
            if (!this._vendValueHelpDialog) {
                this._vendValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ssmc.createordexcptnsom.view.fragments.Vendors",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._vendValueHelpDialog.then(function (oDialog) {
                // Create a filter for the binding
                // oDialog.getBinding("items").filter([new Filter("YYCOMP_NAME", FilterOperator.Contains, sInputValue)]);
                // Open ValueHelpDialog filtered by the input's value
                oDialog.open();
                sap.ui.core.BusyIndicator.hide();
            });
        },
        onVendorValueHelpClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            //oEvent.getSource().getBinding("items").filter([]);
            if (!oSelectedItem) {
                return;
            }
            this.byId("vendorsId").setValue(oSelectedItem.getTitle());
            this.byId("vendorNameId").setValue(oSelectedItem.getInfo());
        },
        onVendorValueHelpSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("value");
            if (sQuery) {
                var oFilter = new Filter({
                    filters: [
                        new Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sQuery),
                        new Filter("Name1", sap.ui.model.FilterOperator.Contains, sQuery)
                    ],
                    and: false
                });
                oEvent.getSource().getBinding("items").filter([oFilter]);
            } else {
                oEvent.getSource().getBinding("items").filter([]);
            }
        },
        onPOValueHelp: function (oEvent) {
            sap.ui.core.BusyIndicator.show(0);
            var sInputValue = oEvent.getSource().getValue(),
                oView = this.getView();
            if (!this._poValueHelpDialog) {
                this._poValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ssmc.createordexcptnsom.view.fragments.PO",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._poValueHelpDialog.then(function (oDialog) {
                var oMultiInput = oView.byId("poId");
                var aTokens = oMultiInput.getTokens().map(function (oToken) {
                    return oToken.getText();
                });
                oDialog.getContent()[1].getBinding("items").filter([]);
                oDialog.getContent()[0].setValue();
                var oList = oDialog.getContent()[1];
                var aItems = oList.getItems();

                aItems.forEach(function (oItem) {
                    var sTitle = oItem.getTitle(); // assuming title is the unique key (Yyname)
                    if (aTokens.indexOf(sTitle) !== -1) {
                        oItem.setSelected(true);
                    } else {
                        oItem.setSelected(false);
                    }
                });
                oDialog.open();
                sap.ui.core.BusyIndicator.hide();
            });
        },
        onPOValueHelpSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            if (sQuery) {
                var oFilter = new Filter({
                    filters: [
                        new Filter("Ebeln", sap.ui.model.FilterOperator.Contains, sQuery)
                    ],
                    and: false
                });
                oEvent.getSource().getParent().getContent()[1].getBinding("items").filter([oFilter]);
            } else {
                oEvent.getSource().getParent().getContent()[1].getBinding("items").filter([]);
            }
        },
        onSelectAllPO: function () {
            const oList = this.byId("poList");
            oList.getItems().forEach(item => item.setSelected(true));
        },
        onPOConfirm: function (oEvent) {
            // get selected items from the list
            const oList = this.byId("poList");
            oList.getBinding("items").filter([]); // clear any existing filters

            const aSelectedItems = oList.getSelectedItems();

            var oMultiInput = this.getView().byId("poId");


            // collect existing token texts
            const aExistingTokens = oMultiInput.getTokens().map(function (oToken) {
                return oToken.getText();
            });

            // loop through selected items
            aSelectedItems.forEach(function (oItem) {
                var sName = oItem.getTitle();

                // only add if not already present
                if (!aExistingTokens.includes(sName)) {
                    oMultiInput.addToken(new sap.m.Token({ text: sName, key: sName }));
                }
            });

            this.byId("poDialog").close();
            var aSelectedTokens = oMultiInput.getTokens().map(function (oToken) {
                return oToken.getText();
            });

            this.readPODetails(aSelectedTokens.join(","));
        },
        onPOCancel: function () {
            this.byId("poDialog").close();
        },
        onPODialogClose: function () {
            const oList = this.byId("poList");
            oList.removeSelections(true);
        },
        onPOTokenUpdate: function (oEvent) {
            if (oEvent.getParameter("type") === "removed") {
                var oMultiInput = oEvent.getSource();
                setTimeout(function () {
                    var aSelectedTokens = oMultiInput.getTokens().map(function (oToken) {
                        return oToken.getText();
                    });
                    this.readPODetails(aSelectedTokens.join(","));
                }.bind(this), 0);
            }
        },
        _getVendorPayload: function (sStatus) {
            var oLocalDataModel = this.getView().getModel("LocalDataModel");
            var oData = oLocalDataModel.getData();
            var loginUser = this.getView().getModel("globalModel").getProperty("/loggedInEmail");
            var aAttachments = oData.AttachmentSet || [];

            // var aAttachmentPayload = aAttachments.map(function (oAttachment) {
            //     var sFileType = "";

            //     // Get extension from file name
            //     if (oAttachment.Filename && oAttachment.Filename.indexOf(".") !== -1) {
            //         sFileType = oAttachment.Filename.split(".").pop().toUpperCase();
            //     }

            //     return {
            //         Yyattachment: oAttachment.Content || "",
            //         YyfileName: oAttachment.Filename || "",
            //         YyfileType: sFileType
            //     };
            // });

            return {
                YyoaExpReqNo: oData.YyoaExpReqNo || "",
                Yysupplier: oData.Yysupplier || "",
                YysupplierName: oData.YysupplierName || "",
                YywavJust: oData.YywavJust || "",
                YyrejectCmnts: oData.YyrejectCmnts || "",
                Yystatus: sStatus,
                Yycrdby: loginUser || "",
                YyreqType: "Vendor",
                YyworkItem: oData.YyworkItem || "",
                ExceptionByVendorToAttachNav: oData.AttachmentSet.map(item => {
                    return {
                        Yyattachment: item.Content,
                        YyfileName: item.Filename,
                        YyfileType: item.Mimetype,
                        YyattchId: item.YyattchId || ""
                    };
                })
            };
        },
        _postVendorRequest: function (sStatus) {
            var oModel = this.getOwnerComponent().getModel();
            var oPayload = this._getVendorPayload(sStatus);

            sap.ui.core.BusyIndicator.show(0);

            oModel.create("/ExceptionByVendorSet", oPayload, {
                success: function (oResponse) {
                    sap.ui.core.BusyIndicator.hide();

                    MessageBox.success(
                        sStatus === "Draft"
                            ? "Request saved successfully."
                            : "Request submitted successfully.",
                        {
                            onClose: function (oAction) {
                                if (oAction === MessageBox.Action.OK) {
                                    this._oRouter.navTo("RouteMain");
                                }
                            }.bind(this)
                        }
                    );

                    // MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("submitted") + ' with Document Number: ' + req.YydocNum, {
                    //         actions: [MessageBox.Action.OK],
                    //         onClose: function (oAction) {
                    //             if (oAction === MessageBox.Action.OK) {
                    //                 this._oRouter.navTo("RouteMain");
                    //             }
                    //         }.bind(this)
                    //     });
                }.bind(this),

                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();

                    if (oError.statusCode === 403 || oError.statusCode === "403") {
                        var xmlString = oError.responseText;
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(xmlString, "text/xml");
                        var messageNode = xmlDoc.getElementsByTagName("message")[0];

                        var itemText = messageNode
                            ? messageNode.childNodes[0].nodeValue
                            : "Authorization error";

                        MessageBox.error(itemText + " - " + oError.statusText);
                    } else {
                        try {
                            if (oError.responseText) {
                                var errorResponse = JSON.parse(oError.responseText);
                                var errorMessage =
                                    errorResponse.error?.message?.value ||
                                    errorResponse.error?.message ||
                                    "An unknown error occurred";

                                MessageBox.error(errorMessage);
                            } else {
                                MessageBox.error(
                                    oError.message || "An unknown error occurred"
                                );
                            }
                        } catch (e) {
                            MessageBox.error(
                                oError.message || "An unknown error occurred"
                            );
                        }
                    }
                }.bind(this)
            });
        },
        _getPOPayload: function (sStatus) {
            var oLocalDataModel = this.getView().getModel("LocalDataModel");
            var oData = oLocalDataModel.getData();

            var oPODetailsModel = this.getView().getModel("poDetailsModel");
            var aPODetails = oPODetailsModel
                ? oPODetailsModel.getData()
                : [];

            var oGlobalModel = this.getView().getModel("globalModel");
            var loginUser = oGlobalModel
                ? oGlobalModel.getProperty("/loggedInEmail")
                : "";

            var aAttachments = oData.AttachmentSet || [];

            /*
             * PO ITEM PAYLOAD
             */
             var formatDateForPayload = function (oDate) {
                 if (!oDate) {
                    return null;
                }
                return oDate.getFullYear() + "-" +
                    String(oDate.getMonth() + 1).padStart(2, "0") + "-" +
                    String(oDate.getDate()).padStart(2, "0") +
                    "T00:00:00";
            };
            var aItemPayload = aPODetails.map(function (oItem) {
                return {
                    YyoaExpReqNo: oData.YyoaExpReqNo || "",
                    YypoNum: oItem.YypoNum || "",
                    YypoLine: oItem.YypoLine || "",
                    YypartDesc: oItem.YypartDesc || "",
                    Yyuom: oItem.Yyuom || "",
                    YyorderedQty: oItem.YyorderedQty || "",
                    YyunitPrice: oItem.YyunitPrice || "",
                    Yyamount: oItem.Yyamount || "",
                    YydeliveryDate: formatDateForPayload(oItem.YydeliveryDate) || null,
                    YyssmcPartNo: oItem.YyssmcPartNo || "",
                    YympnNo: oItem.YympnNo || "",
                    YysuppPartNo: oItem.YysuppPartNo || "",
                    YysupplierName: oItem.YysupplierName || ""
                };
            });

            /*
             * PO ATTACHMENT PAYLOAD
             */
            var aAttachmentPayload = aAttachments.map(function (oAttachment) {
                return {
                    Yyattachment: oAttachment.Content || "",
                    YyfileName: oAttachment.Filename || "",
                    YyfileType: oAttachment.Mimetype || "",
                    YyattchId: oAttachment.YyattchId || ""
                };
            });

            /*
             * COMPLETE PO PAYLOAD
             */
            var oMultiInput = this.getView().byId("poId");
            var aSelectedTokens = oMultiInput.getTokens().map(function (oToken) {
                return oToken.getText();
            });
            return {
                YyoaExpReqNo: oData.YyoaExpReqNo || "",
                YypoNum: aSelectedTokens.join(",") || "",
                YywavJust: oData.YywavJust || "",
                YyrejectCmnts: oData.YyrejectCmnts || "",
                Yystatus: sStatus,
                Yycrdby: loginUser || "",
                YyreqType: "PO",
                Yybuyer: oData.Yybuyer || "",
                YyworkItem: oData.YyworkItem || "",

                ExceptionByPOHeaderToItemNav: aItemPayload,

                ExceptionByPOHeaderToAttachNav: aAttachmentPayload
            };
        },
        _postPORequest: function (sStatus) {
            var oModel = this.getOwnerComponent().getModel();
            var oPayload = this._getPOPayload(sStatus);

            sap.ui.core.BusyIndicator.show(0);

            oModel.create("/ExceptionByPOHeaderSet", oPayload, {
                success: function (oResponse) {
                    sap.ui.core.BusyIndicator.hide();

                    MessageBox.success(
                        sStatus === "Draft"
                            ? "Request saved successfully."
                            : "Request submitted successfully.",
                        {
                            onClose: function (oAction) {
                                if (oAction === MessageBox.Action.OK) {
                                    this._oRouter.navTo("RouteMain");
                                }
                            }.bind(this)
                        }
                    );
                }.bind(this),

                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();

                    if (oError.statusCode === 403 || oError.statusCode === "403") {

                        var xmlString = oError.responseText;
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(xmlString, "text/xml");
                        var messageNode = xmlDoc.getElementsByTagName("message")[0];

                        var itemText = messageNode
                            ? messageNode.childNodes[0].nodeValue
                            : "Authorization error";

                        MessageBox.error(itemText + " - " + oError.statusText);

                    } else {

                        try {

                            if (oError.responseText) {

                                var errorResponse = JSON.parse(oError.responseText);

                                var errorMessage =
                                    errorResponse.error?.message?.value ||
                                    errorResponse.error?.message ||
                                    "An unknown error occurred";

                                MessageBox.error(errorMessage);

                            } else {

                                MessageBox.error(
                                    oError.message || "An unknown error occurred"
                                );
                            }

                        } catch (e) {

                            MessageBox.error(
                                oError.message || "An unknown error occurred"
                            );
                        }
                    }
                }.bind(this)
            });
        },
        onSavePress: function () {
            if (this.requestType === "Vendor") {
                this._postVendorRequest("Draft");
            } else if (this.requestType === "PO") {
                this._postPORequest("Draft");
            }
        },
        onSubmitPress: function () {
            if (this.requestType === "Vendor") {
                this._postVendorRequest("Submit");
            } else if (this.requestType === "PO") {
                this._postPORequest("Submit");
            }
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