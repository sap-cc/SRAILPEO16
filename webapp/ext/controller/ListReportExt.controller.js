sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function(MessageToast, Fragment) {
    'use strict';

    return {

        /**
         * Create new Production Orders
         * @param {*} oEvent 
         */
        createNewPOs: function (oEvent) {
            const oI18n = this.getView().getModel("i18n").getResourceBundle();
            this.getView().setBusy(true);

            let aItems = this._oTable.getItems()[0].getSelectedItems();
            let aObjects = [];
            for (let key in aItems) {
                let oItem = aItems[key];
                let oObject = oItem.getBindingContext().getObject();
                if (oObject.LIEF === "X" || oObject.COGI === "X") {
                    oItem.setSelected(false);
                } else {
                    aObjects.push(oObject);
                }
            }
            
            // gesammelte Objekte
            let sPo = "", sRes = "", sResPos = "";
            for (let key in aObjects) {
                sPo += aObjects[key].ProductionOrder + ",";
                sRes += aObjects[key].ReservationKey + ",";
                sResPos += aObjects[key].ReservationPosition + ",";
            }
            // an den Funktionsimport uebergeben
            let mParams = {
                ProductionOrder: sPo,
                ReservationKey: sRes,
                ReservationPosition: sResPos
            }
 
            if (sPo !== "") {
                let that = this;
                const oModel = this.getView().getModel();
                oModel.callFunction("/processProdOrders", {
                    method: "POST",
                    urlParameters: mParams,
                    success: function (oData, oResponse) {
                        if (oData.Status === "OK") {
                            let oDialog = new sap.m.Dialog({
                                title: oI18n.getText("procOrdersTitle"),
                                type: "Message",
                                state: "Success",
                                content: new sap.m.Text({ text: oI18n.getText("procOrdersMsg") }),
                                beginButton: new sap.m.Button({
                                    text: oI18n.getText("yes"),
                                    press: function() {
                                        that._navigateToProcessing();
                                        oDialog.close();
                                    }
                                }),
                                endButton: new sap.m.Button({
                                    text: oI18n.getText("no"),
                                    press: function() {
                                        oDialog.close();
                                    }
                                }),
                                afterClose: function() {
                                    oDialog.destroy();
                                }
                            });
                            oDialog.open();

                        } else {
                            new sap.m.MessageBox.show(oData.Message, {
                                title: oData.Status,
                                icon: sap.m.MessageBox.Icon.WARNING
                            });
                        }
                        that._oTable.getItems()[0].removeSelections(true);
                        oModel.refresh(true);
                        that.getView().setBusy(false);

                    },
                    error: function (oError) {
                        that.getView().setBusy(false);
                        let sMessage = oError.message + "\n" + oError.statusText;
                        new sap.m.MessageBox.show(sMessage, {
                            title: oI18n.getText("servererror"),
                            icon: sap.m.MessageBox.Icon.ERROR
                        });
                    }
                });
            } else {
                this.getView().setBusy(false);
                MessageToast.show(oI18n.getText("nothingValid"));
            }

        },

        /**
         * Jump to "PEO Processing of Production Orders"-App
         * @param {*} oEvent 
         */
        _navigateToProcessing: function(oEvent) {
            sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then( function (oService) {
                oService.toExternal({
                    target : {
                        semanticObject: "ZMissingPartsNewPo",
                        action: "display"
                    }
                });
            });
        },

        onBeforeRebindTableExtension: function(oEvent) {
            this._oTable = this.getView().byId(oEvent.getSource().getId());
        },

        /**
         * add parameters before navigation
         * @param {*} oSelectionVariant 
         * @param {*} oObjectInfo 
         */
        adaptNavigationParameterExtension: function (oSelectionVariant, oObjectInfo) {
            // (eigenes) semantisches Objekt zum Absprung in COGI
            if (oObjectInfo.semanticObject === "ZMissingParts"/* && oObjectInfo.action === "cogi"*/) {
                let sPo, sMat, sCogi = "";
                if (oSelectionVariant.getValue("ProductionOrder") !== undefined) {
                    sPo = oSelectionVariant.getValue("ProductionOrder")[0].Low;
                }
                if (oSelectionVariant.getValue("ZMissingParts") !== undefined) {
                    sMat = oSelectionVariant.getValue("ZMissingParts")[0].Low;
                }
                /*if (oSelectionVariant.getValue("Material") !== undefined) {
                    sMat = oSelectionVariant.getValue("Material")[0].Low;
                }*/
                if (oSelectionVariant.getValue("COGI") !== undefined) {
                    sCogi = oSelectionVariant.getValue("COGI")[0].Low;
                }
                oObjectInfo.action = "cogi";
                oSelectionVariant.addParameter("S_AUFNR-LOW", sPo);
                //oSelectionVariant.addParameter("S_MATNR-LOW", sMat); // nicht mehr gefragt
            }
        }
    };
});