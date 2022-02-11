let oAPP = (function () {
    "use strict";

    const
        SERVER_URL = "http://192.168.0.6:9992",
        REMOTE = require('electron').remote,
        APP = REMOTE.app,
        PATH = REMOTE.require('path'),
        APPPATH = APP.getAppPath();


    return {

        onStart: function () {

            var oServerUrlInput = document.getElementById("serverUrl");
            oServerUrlInput.value = SERVER_URL;

        },

        // 서버 커넥션 체크
        onCheckServerConnect: function () {

            var oServerUrlInput = document.getElementById("serverUrl");
            var sUrl = oServerUrlInput.value;

            sUrl += "/ping";

            if (sUrl == "" || typeof sUrl == "undefined") {
                alert("Server URL을 입력하세요!");
                return;
            }

            oAPP.sendAjax(sUrl, "GET", true, "", function (oData) {

                if (oData == "") {
                    alert("nerwork error!!");
                    oAPP.setBusy('');
                    return;
                }

                var oResult = JSON.parse(oData);

                if (oResult.RETCD != "S") {
                    oAPP.setBusy('');
                    return;
                }

                alert(oResult.MSG);
                oAPP.setBusy('');

            });

        },

        onWWWManager: function () {

            var oServerUrlInput = document.getElementById("serverUrl"),
                sUrl = oServerUrlInput.value;

            var sServiceUrl = sUrl + "/getAppMetadata";

            // 버전 리스트 정보를 구한다.
            oAPP.getAppMetadata(sServiceUrl, function (oResult) {

                debugger;

                if (typeof oResult == "boolean" && oResult == false) {
                    return;
                }

                // 버전 리스트를 보여줄 팝업을 띄운다.
                oAPP.onAppManagerPopupOpen(oResult);

            });

        },

        getAppMetadata: function (sServiceUrl, fnCallback) {

            oAPP.sendAjax(sServiceUrl, "GET", true, "", function (oData) {

                oAPP.setBusy('');

                if (oData == "") {
                    alert("nerwork error!!");
                    fnCallback(false);
                    return;
                }

                var oResult = JSON.parse(oData);

                if (oResult.RETCD == "E") {
                    alert(oResult.MSG);
                    fnCallback(false);
                    return;
                }

                fnCallback(oResult);

            });

        },

        onAppManagerPopupOpen: function (oResult) {

            var oServerUrlInput = document.getElementById("serverUrl"),
                sServerUrl = oServerUrlInput.value;

            var oAppMetaData = oResult.DATA,
                oCurrWin = REMOTE.getCurrentWindow(),
                oBrowserOptions = {
                    "width": 800,
                    "height": 800,
                    "resizable": true,
                    "movable": true,
                    "closable": true,
                    "modal": true,
                    "parent": oCurrWin,
                    "webPreferences": {
                        "nodeIntegration": true,
                    }
                };

            // Server List 화면 오픈
            var oWin = new REMOTE.BrowserWindow(oBrowserOptions);
            oWin.webContents.openDevTools();

            oWin.loadURL(PATH.join(APPPATH, '/www.html'));

            oWin.webContents.on('did-finish-load', function () {

                var oParam = {
                    SERV_URL: sServerUrl,
                    META: oAppMetaData
                };

                oWin.webContents.send('if-ver-info', oParam);

            });

            oWin.on('closed', () => {
                oWin = null;
                // oWin.close();
            });

        },

        // 업데이트
        setWWWUpdate: function () {

            var oServerUrlInput = document.getElementById("serverUrl"),
                sServerUrl = oServerUrlInput.value;

            var aVer = oResult.DATA;

            var oCurrWin = REMOTE.getCurrentWindow();
            var oBrowserOptions = {
                "width": 300,
                "height": 300,
                "resizable": true,
                "movable": true,
                "closable": true,
                "modal": true,
                "parent": oCurrWin,
                "webPreferences": {
                    "nodeIntegration": true,
                }
            };

            // Server List 화면 오픈
            let oWin = new REMOTE.BrowserWindow(oBrowserOptions);
            oWin.loadURL(PATH.join(APPPATH, '/Download.html'));

            oWin.webContents.on('did-finish-load', function () {

                var oParam = {
                    SERV_URL: sServerUrl,
                    VER: aVer
                };

                oWin.webContents.send('if-ver-info', oParam);

            });

            oWin.on('closed', () => {
                oWin = null;
                // oWin.close();
            });


        },

        sendAjax: function (sUrl, sMethod, bIsAsync, sResType, fnCallback) {

            oAPP.setBusy('X');

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {

                if (xhr.readyState == 4 && xhr.status == 200) {

                    fnCallback(this.response);

                }

            };

            xhr.onerror = function (e) {

                oAPP.setBusy('');

                alert("network Request Fail!");

            };


            if (sResType != "" && typeof sResType !== "undefined") {
                xhr.responseType = sResType;
            }

            xhr.open(sMethod, sUrl, bIsAsync);
            xhr.send();

        },

        setBusy: function (bIsBusy) {

            var oBusy = document.getElementById("u4aWsBusyIndicator");

            if (!oBusy) {
                return;
            }

            if (bIsBusy == 'X') {
                oBusy.style.visibility = "visible";
            } else {
                oBusy.style.visibility = "hidden";
            }

        },


    };



})();




document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {

    oAPP.onStart();
}