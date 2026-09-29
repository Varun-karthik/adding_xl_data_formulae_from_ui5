sap.ui.define([], function () {
    "use strict";

    return {
        formatDate: function (oDate) {
            if (!oDate) {
                return "";
            }
            const dateObj = (oDate instanceof Date) ? oDate : new Date(oDate);

            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthName = monthNames[dateObj.getMonth()];
            const dayStr = String(dateObj.getDate()).padStart(2, '0');
            const yearStr = dateObj.getFullYear();

            return `${dayStr} ${monthName} ${yearStr}`;
        },
        formatQuantityZero: function (quantity) {
            if (!quantity || quantity === "0.000" || quantity === 0.000) {
                return "";
            }
            return quantity;
        }
    };
});