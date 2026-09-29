sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "com/ssmc/createordexcptnsom/model/formatter",
    "sap/ui/export/Spreadsheet",
    'sap/m/MessageToast'
], (Controller, JSONModel, MessageBox, Filter, FilterOperator, formatter, Spreadsheet, MessageToast) => {
    "use strict";

    return Controller.extend("com.ssmc.createordexcptnsom.controller.Main", {
        formatter: formatter,
        onInit() {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.getRoute("RouteMain").attachPatternMatched(this._oRouteMatched, this);
        },
        _oRouteMatched: function () {
            this.readStatus();
            this.readTableData();
        },
        readStatus: function () {
            sap.ui.core.BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/ExceptionStatusDropdownSet", {
                success: function (res) {
                    if (res.results.length !== 0) {
                        var oStatusModel = new JSONModel(res.results);
                        this.getView().setModel(oStatusModel, "statusModel");
                    } else {
                        var oStatusModel = new JSONModel({});
                        this.getView().setModel(oStatusModel, "statusModel");
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
        onLineItemPress: function (oEvent) {
            // var poNum = '123';
            // var supplier = 'abc';
            var sPath = oEvent.getSource().getBindingContext("mainDataModel").getPath();
            var oaExcNum = this.getView().getModel("mainDataModel").getProperty(sPath + "/YyoaExpReqNo"),
                rqstType = this.getView().getModel("mainDataModel").getProperty(sPath + "/YyreqType"),
                status = this.getView().getModel("mainDataModel").getProperty(sPath + "/Yystatus");
            if (status === "Draft") {
                this._oRouter.navTo("Create", { oaExcNum: oaExcNum, rqstType: rqstType, status: status });
            } else {
                this._oRouter.navTo("Details", { oaExcNum: oaExcNum, rqstType: rqstType, status: status });
            }
        },
        onCreateExceptionPress: function () {
            this._oRouter.navTo("Create");
        },
        readTableData: function () {
            sap.ui.core.BusyIndicator.show(0);
            
            // Kept UI field references untouched in case they are needed elsewhere in your logic
            var oView = this.getView();
            var oOaExceptionRequestInput = oView.byId("oaExceptionRequest");
            var oVendorCodeInput = oView.byId("vendorCode");
            var oApprovedDatePicker = oView.byId("approvedDate");
            var oStatusInput = oView.byId("status");
            var oRequestTypeInput = oView.byId("requestType");
            var oPoNumberInput = oView.byId("poNumber");
            var oBuyerNameInput = oView.byId("buyerName");
            var oVendorNameInput = oView.byId("vendorName");
            var oDateFromPicker = oView.byId("dateFrom");
            var oDateToPicker = oView.byId("dateTo");

            // Dummy Mock Data array reflecting backend property structures
            var aMockResults = [
                {
                    Yycrdate: new Date("2026-09-01"),
                    YyoaExpReqNo: "OA-2026-0001",
                    YyreqType: "Price Variance",
                    YysupplierName: "Acme Logistics Global",
                    Yysupplier: "VEND001",
                    YypoNum: "4500123456",
                    Yapproveddate: new Date("2026-09-03"),
                    Yycrdby: "John Doe",
                    Yystatus: "Approved",
                    YyWSP:10,
                    YyMRP:20
                },
                {
                    Yycrdate: new Date("2026-09-10"),
                    YyoaExpReqNo: "OA-2026-0002",
                    YyreqType: "Quantity Mismatch",
                    YysupplierName: "Apex Manufacturing Inc",
                    Yysupplier: "VEND002",
                    YypoNum: "4500123457",
                    Yapproveddate: new Date("2026-09-03"),
                    Yycrdby: "Jane Smith",
                    Yystatus: "Pending",
                    YyWSP:10,
                    YyMRP:20
                },
                {
                    Yycrdate: new Date("2026-09-15"),
                    YyoaExpReqNo: "OA-2026-0003",
                    YyreqType: "Late Delivery Approval",
                    YysupplierName: "Cyberdyne Systems",
                    Yysupplier: "VEND003",
                    YypoNum: "4500123458",
                    Yapproveddate: new Date("2026-09-16"),
                    Yycrdby: "Saniya Shaikh",
                    Yystatus: "Approved",
                    YyWSP:10,
                    YyMRP:20
                },
                {
                    Yycrdate: new Date("2026-09-22"),
                    YyoaExpReqNo: "OA-2026-0004",
                    YyreqType: "Tax Code Exception",
                    YysupplierName: "Stark Industries",
                    Yysupplier: "VEND004",
                    YypoNum: "4500123459",
                    Yapproveddate: new Date("2026-09-03"),
                    Yycrdby: "John Doe",
                    Yystatus: "",
                    YyWSP:20,
                    YyMRP:20
                },
                {
                    Yycrdate: new Date("2026-09-27"),
                    YyoaExpReqNo: "OA-2026-0005",
                    YyreqType: "Price Variance",
                    YysupplierName: "Wayne Enterprises",
                    Yysupplier: "VEND005",
                    YypoNum: "4500123460",
                    Yapproveddate: new Date("2026-09-03"),
                    Yycrdby: "Saniya Shaikh",
                    Yystatus: "",
                    YyWSP:5,
                    YyMRP:10
                }
            ];

            // Simulate backend response delay using setTimeout
            setTimeout(function () {
                // Instantiate JSONModel using the new binding name: oaExceptionModel
                var oOaExceptionModel = new sap.ui.model.json.JSONModel(aMockResults);
                this.getView().setModel(oOaExceptionModel, "oaExceptionModel");
                
                sap.ui.core.BusyIndicator.hide();
            }.bind(this), 1000);
        },
        // readTableData: function () {
        //     sap.ui.core.BusyIndicator.show(0);
        //     var oModel = this.getOwnerComponent().getModel();
        //     //var that = this;
        //     // var loginUser = this.getView().getModel("globalModel").getProperty("/loggedInEmail");
        //     var oView = this.getView();
        //     var oOaExceptionRequestInput = oView.byId("oaExceptionRequest");
        //     var oVendorCodeInput = oView.byId("vendorCode");
        //     var oApprovedDatePicker = oView.byId("approvedDate");
        //     var oStatusInput = oView.byId("status");
        //     var oRequestTypeInput = oView.byId("requestType");
        //     var oPoNumberInput = oView.byId("poNumber");
        //     var oBuyerNameInput = oView.byId("buyerName");
        //     var oVendorNameInput = oView.byId("vendorName");
        //     var oDateFromPicker = oView.byId("dateFrom");
        //     var oDateToPicker = oView.byId("dateTo");

        //     var aFilters = [
        //         new Filter("YyoaExpReqNo", FilterOperator.EQ, oOaExceptionRequestInput.getValue() || ""),
        //         new Filter("Yysupplier", FilterOperator.EQ, oVendorCodeInput.getValue() || ""),
        //         new Filter("Yapproveddate", FilterOperator.EQ, oApprovedDatePicker.getValue() || null),
        //         new Filter("Yystatus", FilterOperator.EQ, oStatusInput.getSelectedKeys().join(",") || ""),
        //         new Filter("YyreqType", FilterOperator.EQ, oRequestTypeInput.getValue() || ""),
        //         new Filter("YypoNum", FilterOperator.EQ, oPoNumberInput.getValue() || ""),
        //         new Filter("Yybuyer", FilterOperator.EQ, oBuyerNameInput.getValue() || ""),
        //         new Filter("YysupplierName", FilterOperator.EQ, oVendorNameInput.getValue() || ""),
        //         new Filter("YydateOfReqFrom", FilterOperator.GE, oDateFromPicker.getValue() || null),
        //         new Filter("YydateOfReqTo", FilterOperator.LE, oDateToPicker.getValue() || null),
        //         //new Filter("Yycrdby", FilterOperator.EQ, loginUser)
        //     ];
        //     var oFilter = new sap.ui.model.Filter({
        //         filters: aFilters,
        //         and: true
        //     });
        //     ///sap/opu/odata/sap/YAPI_SUPPLIER_ORDER_MANAGEMENT_SRV/OAInitialScreenSet?$filter=(Yycrdby eq 'Saniya.Shaikh@yash.com')&$format=json
        //     oModel.read("/ExceptionInitialScreenSet", {
        //         filters: [oFilter],
        //         // urlParameters: {
        //         //     "$expand": "POBlockToAttachNav"
        //         // },
        //         success: function (res) {
        //             if (res.results.length !== 0) {
        //                 var oMainDataModel = new JSONModel(res.results);
        //                 this.getView().setModel(oMainDataModel, "mainDataModel");
        //             } else {
        //                 var oMainDataModel = new JSONModel({});
        //                 this.getView().setModel(oMainDataModel, "mainDataModel");
        //             }
        //             sap.ui.core.BusyIndicator.hide();
        //         }.bind(this),
        //         error: function (oError) {
        //             sap.ui.core.BusyIndicator.hide();
        //             // MessageBox.error(JSON.parse(err.responseText).error.message.value);
        //             if (oError.statusCode === 403 || oError.statusCode === "403") {
        //                 const xmlString = oError.responseText;
        //                 const parser = new DOMParser();
        //                 const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        //                 const itemText = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
        //                 MessageBox.error(itemText + " - " + oError.statusText);

        //             }
        //             else {
        //                 try {
        //                     if (oError.responseText) {
        //                         var errorResponse = JSON.parse(oError.responseText);
        //                         var errorMessage = errorResponse.error?.message?.value || errorResponse.error?.message || "An unknown error occurred";
        //                         MessageBox.error(errorMessage);
        //                     } else {
        //                         MessageBox.error("An unknown error occurred");
        //                     }
        //                 } catch (e) {

        //                     MessageBox.error(oError.message || "An unknown error occurred");
        //                 }
        //             }
        //         }.bind(this)
        //     });
        // },
        clearFilters: function () {
            this.getView().byId("oaExceptionRequest").setValue("");
            this.getView().byId("vendorCode").setValue("");
            this.getView().byId("approvedDate").setValue(null);
            this.getView().byId("status").setSelectedKeys();
            this.getView().byId("requestType").setValue("");
            this.getView().byId("poNumber").setValue("");
            this.getView().byId("buyerName").setValue("");
            this.getView().byId("vendorName").setValue("");
            this.getView().byId("dateFrom").setValue(null);
            this.getView().byId("dateTo").setValue(null);
            this.readTableData();
        },
        // onExportExcel: function () {
        //     var oModel =
        //         this.getView().getModel("oaExceptionModel");
        //     var aData =
        //         oModel.getProperty("/") || [];
        //     if (!aData.length) {
        //         MessageBox.warning(
        //             "There is no data available to download."
        //         );
        //         return;
        //     }
        //     var aCols = [
        //         { label: "Date", property: "Yycrdate", type: "date", format: "yyyy-MM-dd" },
        //         { label: "OA Exception Request", property: "YyoaExpReqNo", type: "string" },
        //         { label: "Request Type", property: "YyreqType", type: "string" },
        //         { label: "Vendor Name", property: "YysupplierName", type: "string" },
        //         { label: "Vendor Code", property: "Yysupplier", type: "string" },
        //         { label: "PO Number", property: "YypoNum", type: "string" },
        //         { label: "Approved Date", property: "Yapproveddate", type: "date", format: "yyyy-MM-dd" },
        //         { label: "Buyer", property: "Yybuyer", type: "string" },
        //         { label: "Status", property: "Yystatus", type: "string" }
        //     ];
        //     var oSettings = {
        //         workbook: {
        //             columns: aCols
        //         },
        //         dataSource: aData,
        //         fileName:
        //             "Exceptions_List.xlsx",

        //         worker: false
        //     };
        //     var oSheet =
        //         new Spreadsheet(oSettings);
        //     oSheet.build().then(function () {
        //         MessageToast.show(
        //             "Excel downloaded successfully."
        //         );
        //     })
        //         .catch(function (oError) {
        //             console.error(
        //                 "Excel download error:",
        //                 oError
        //             );
        //             MessageBox.error(
        //                 "Error while downloading Excel."
        //             );
        //         })
        //         .finally(function () {
        //             oSheet.destroy();
        //         });
        // },
// 

       onExportExcel: function () {

            var oModel = this.getView().getModel("oaExceptionModel");
            var aData = oModel.getProperty("/") || [];

            if (!aData.length) {
                MessageBox.warning("There is no data available to download.");
                return;
            }

            if (typeof ExcelJS === "undefined") {
                MessageBox.error("ExcelJS library is not loaded.");
                return;
            }

            var oWorkbook = new ExcelJS.Workbook();
            var oSheet = oWorkbook.addWorksheet("Exceptions");

            // Excel columns
            var aColumns = [
                { header: "Date", key: "date", width: 12 },
                { header: "OA Exception Request", key: "oaRequest", width: 22 },
                { header: "Request Type", key: "requestType", width: 20 },
                { header: "Vendor Name", key: "vendorName", width: 25 },
                { header: "Vendor Code", key: "vendorCode", width: 15 },
                { header: "PO Number", key: "poNumber", width: 15 },
                { header: "Approved Date", key: "approvedDate", width: 12 },
                { header: "Buyer", key: "buyer", width: 15 },
                { header: "Status", key: "status", width: 15 },
                { header: "Wholesale Price", key: "wsp", width: 18 },
                { header: "MRP", key: "mrp", width: 15 }
            ];

            oSheet.columns = aColumns;

            //  table rows
            var aTableRows = aData.map(function (oItem) {
                return [
                    oItem.Yycrdate || null,
                    oItem.YyoaExpReqNo || "",
                    oItem.YyreqType || "",
                    oItem.YysupplierName || "",
                    oItem.Yysupplier || "",
                    oItem.YypoNum || "",
                    oItem.Yapproveddate || null,
                    oItem.Yycrdby || "",
                    oItem.Yystatus || "",
                    oItem.YyWSP !== null && oItem.YyWSP !== undefined
                        ? Number(oItem.YyWSP)
                        : null,
                    oItem.YyMRP !== null && oItem.YyMRP !== undefined
                        ? Number(oItem.YyMRP)
                        : null
                ];
            });

            // Adding rows to worksheet
            aTableRows.forEach(function (aRow) {
                oSheet.addRow(aRow);
            });

            //Date Formatting
            oSheet.getColumn("A").numFmt = "yyyy-mm-dd";
            oSheet.getColumn("G").numFmt = "yyyy-mm-dd";
            // Price Formatting 
            oSheet.getColumn("J").numFmt = "0.00";
            oSheet.getColumn("K").numFmt = "0.00";


            // WSP <= MRP validation
            for (var i = 2; i <= aData.length + 10; i++) {

                oSheet.getCell("J" + i).dataValidation = {
                    type: "custom",
                    formulae: ["J" + i + "<=K" + i],
                    allowBlank: true,
                    showErrorMessage: true,
                    errorStyle: "stop",
                    errorTitle: "Invalid Wholesale Price",
                    error: "Wholesale Price must be less than or equal to MRP."
                };
            }

            // Status dropdown
            var aStatus = [ "Open", "Close", "In Progress", "Verified", "Approved", "Rejected" ];


            for (var j = 2; j <= aData.length + 10; j++) {

                oSheet.getCell("I" + j).dataValidation = {
                    type: "list",
                    formulae: ['"' + aStatus.join(",") + '"'],
                    allowBlank: true,
                    showErrorMessage: true,
                    errorStyle: "stop",
                    errorTitle: "Invalid Status",
                    error: "Please select a valid Status."
                };
            }

            // Download Excel
            oWorkbook.xlsx.writeBuffer()
                .then(function (oBuffer) {

                    var oBlob = new Blob([oBuffer]);

                    var sUrl = URL.createObjectURL(oBlob);
                    var oLink = document.createElement("a");

                    oLink.href = sUrl;
                    oLink.download = "Exceptions_List.xlsx";
                    oLink.click();

                    URL.revokeObjectURL(sUrl);

                    MessageToast.show("Excel downloaded successfully.");

                })
                .catch(function (oError) {

                    console.error("Excel download error:", oError);
                    MessageBox.error("Error while downloading Excel.");

                });
        }

    });
});