let oAPP = (function () {
    "use strict";

    const
        REMOTE = require('electron').remote,
        DIALOG = REMOTE.require('electron').dialog,
        IPCRENDERER = require('electron').ipcRenderer;

    return {

        onStart: function () {

            IPCRENDERER.on("if-ver-info", function (events, oParam) {

                // 서버 URL 정보
                oAPP.serverUrl = oParam.SERV_URL;

                var oMeta = oParam.META;

                // WWW 의 버전 리스트
                var aVerList = oMeta.VERLIST,
                    aPluginList = oMeta.PLUGINS;

                // version list
                oAPP.setVersionList(aVerList);

                // plugin list
                oAPP.setPluginList(aPluginList);

            });

        },

        // 플러그인 리스트 초기화
        setPluginListRefresh: function(){

            var sServiceUrl = sUrl + "/getAppMetadata";

            // 버전 리스트 정보를 구한다.
            oAPP.getAppMetadata(sServiceUrl, function (oResult) {



            });

        },

        // 플러그인 목록 업데이트 하기..
        setPluginListUpdate: function () {

            debugger;

            var oTxtArea = document.getElementById("pluginTxtArea");
            if (typeof oTxtArea === "undefined") {
                return;
            }

            var sPluginValue = oTxtArea.value,
                aPluginList = sPluginValue.split("\n"),
                sPluginJson = JSON.stringify(aPluginList);
                sPluginJson = encodeURIComponent(sPluginJson);

            var sServerUrl = oAPP.serverUrl + "/setUpdatePluginList";

            var oForm = new FormData();
            oForm.append("PLUGIN", sPluginJson);

            oAPP.setBusy('X');

            oAPP.sendAjax(sServerUrl, "POST", oForm, true, "", function (oData) {

                oAPP.setBusy('');

                debugger;





            });

        },

        // plugin list
        setPluginList: function (aPluginList) {

            var oTxtArea = document.getElementById("pluginTxtArea");
            if (typeof oTxtArea === "undefined") {
                return;
            }

            var iPluginLength = aPluginList.length;

            var sPlugin = "";
            for (var i = 0; i < iPluginLength; i++) {
                sPlugin += aPluginList[i] + "\n";
            }

            oTxtArea.value = sPlugin;

        },

        // version list        
        setVersionList: function (aVerList) {

            var oSelect = document.getElementById("versionSelect");
            if (typeof oSelect == "undefined") {
                return;
            }

            var iVerListLength = aVerList.length;
            for (var i = 0; i < iVerListLength; i++) {

                var sVer = aVerList[i];

                var oSelOpt = document.createElement("option");
                oSelOpt.setAttribute("value", sVer);
                oSelOpt.innerHTML = sVer;
                oSelect.appendChild(oSelOpt);

            }

        },

        getWWWOriginFile: function () {

            var oSelect = document.getElementById("versionSelect");
            if (typeof oSelect == "undefined") {
                return;
            }

            var sVerInfo = oSelect.options[oSelect.selectedIndex].value;

            var sServerUrl = oAPP.serverUrl + "/getWWWOriginFile";

            var oForm = new FormData();
            oForm.append("VER", sVerInfo);

            oAPP.sendAjax(sServerUrl, "POST", oForm, true, "blob", function (oResponse) {

                oAPP.setBusy('');

                // www 원본 파일 저장
                oAPP.getWWWOrigFileDown(oResponse, sVerInfo);

            });

        },

        // www 원본 파일 저장
        getWWWOrigFileDown: function (oFile, sVer) {

            let FS = require('fs-extra'),
                SHELL = REMOTE.shell;

            // 다운받을 폴더 지정하는 팝업에 대한 Option
            var options = {
                // See place holder 1 in above image
                title: "File Download",

                // See place holder 2 in above image            
                // defaultPath: process.env.USERPROFILE + "\\Downloads",

                // See place holder 3 in above image
                // buttonLabel: "Save",

                // See place holder 4 in above image
                filters: [

                ],

                properties: ['openDirectory', '']

            };

            var oCurrWin = REMOTE.getCurrentWindow();

            //파일 폴더 디렉토리 선택 팝업 
            var filePaths = REMOTE.dialog.showOpenDialog(oCurrWin, options);
            if (!filePaths) {

                // Busy 실행 끄기
                oAPP.setBusy('');
                return;
            }

            var fileName = sVer + ".zip",

                //파일 Path 와 파일 명 조합 
                folderPath = filePaths[0],
                filePath = folderPath + "\\" + fileName; //폴더 경로 + 파일명

            var fileReader = new FileReader();
            fileReader.onload = function (event) {

                var arrayBuffer = event.target.result,
                    buffer = Buffer.from(arrayBuffer);

                //PC DOWNLOAD 
                FS.writeFile(filePath, buffer, {}, (err, res) => {

                    if (err) {
                        alert(err.toString());
                        return;
                    }

                    // 파일 다운받은 폴더를 오픈한다.
                    SHELL.showItemInFolder(filePath);

                    // Busy 실행 끄기
                    oAPP.setBusy('');

                });

            };

            fileReader.readAsArrayBuffer(oFile);
        },

        sendAjax: function (sUrl, sMethod, oFormData, bIsAsync, sResType, fnCallback) {

            oAPP.setBusy('X');

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {

                if (xhr.readyState == 4 && xhr.status == 200) {

                    oAPP.setBusy('');

                    var oResponse = xhr.response;

                    if (oResponse instanceof Blob && oResponse.type.startsWith("text")) {

                        var reader = new FileReader();
                        reader.onload = function () {

                            var sRetJson = reader.result,
                                oRet = JSON.parse(sRetJson);

                            if (oRet.RETCD == "E") {
                                alert(oRet.MSGTXT);
                            }

                        }

                        reader.readAsText(oResponse);

                        return;
                    }

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

            if (typeof oFormData !== "undefined" && oFormData instanceof FormData == true) {
                xhr.send(oFormData);
                return;
            }

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

        checkAttachFile: function (oFileObj) {

            var aFiles = oFileObj.files,
                iFileLength = aFiles.length;

            if (iFileLength == 0) {
                return;
            }

            var oFile = aFiles[0];

            // 압축파일(zip)만 첨부 가능
            if (!oFile.path.endsWith("zip") || oFile.type != "application/x-zip-compressed") {

                oFileObj.value = null;
                alert("zip 파일만 첨부하세요");

                return;

            }

        }, // end of checkAttachFile

        addNewVersion: function () {

            var oFileAtt = document.getElementById("fileAtt");

            var aFiles = oFileAtt.files,
                iFileLength = aFiles.length;

            if (iFileLength == 0) {
                alert("추가할 버전의 파일을 첨부하세요");
                return;
            }

            var oCurrView = REMOTE.getCurrentWindow(),
                sMsg = "신규 버전을 추가하시겠습니까?";

            var iBtnIndex = DIALOG.showMessageBox(oCurrView, {
                title: "New",
                message: sMsg,
                type: "warning",
                buttons: ["예", "아니오"]

            });

            if (iBtnIndex != 0) {
                return;
            }

            var oFile = aFiles[0];

            var sServerUrl = oAPP.serverUrl + "/newver";

            var oForm = new FormData();
            oForm.append("FILE", oFile);

            oAPP.setBusy('X');

            oAPP.sendAjax(sServerUrl, "POST", oForm, true, "", function (oData) {

                oAPP.setBusy('');

                var oResult = JSON.parse(oData);

                alert(oResult.MSGTXT);

                if (oResult.RETCD == 'E') {
                    return;
                }

                oFileAtt.value = null;

                var oSelect = document.getElementById("versionSelect");
                if (typeof oSelect == "undefined") {
                    return;
                }

                // 버전 드롭다운 갱신
                oAPP.clearChildNodes(oSelect);

                oAPP.setVersionList(oResult.DATA);

            });

        }, // end of addNewVersion

        setUpdate: function () {

            // 첨부파일 유무 확인
            var oFileAtt = document.getElementById("fileAtt"),
                aFiles = oFileAtt.files,
                iFileLength = aFiles.length;

            if (iFileLength == 0) {
                alert("업데이트할 버전의 파일을 첨부하세요");
                return;
            }

            // 현재 선택된 ver 정보를 구한다.
            var oSelect = document.getElementById("versionSelect");
            if (typeof oSelect == "undefined") {
                return;
            }

            var sVerInfo = oSelect.options[oSelect.selectedIndex].value;

            var oCurrView = REMOTE.getCurrentWindow(),
                sMsg = "현재 선택한 버전은 [" + sVerInfo + "] 입니다. \n\n";
            sMsg += "해당 버전을 업데이트 하시겠습니까?";

            var iBtnIndex = DIALOG.showMessageBox(oCurrView, {
                title: "UPDATE",
                message: sMsg,
                type: "warning",
                buttons: ["예", "아니오"]

            });

            if (iBtnIndex != 0) {
                return;
            }

            // 첨부파일
            var oFile = aFiles[0],
                sServerUrl = oAPP.serverUrl + "/update";

            var oForm = new FormData();
            oForm.append("VER", sVerInfo);
            oForm.append("FILE", oFile);

            oAPP.setBusy('X');

            oAPP.sendAjax(sServerUrl, "POST", oForm, true, "", function (oData) {

                oAPP.setBusy('');

                var oResult = JSON.parse(oData);

                alert(oResult.MSGTXT);

                if (oResult.RETCD == 'E') {
                    return;
                }

                oFileAtt.value = null;

            });

        },

        /* 하위 자식들 다 삭제*/
        clearChildNodes: function (oUI) {

            if (typeof oUI == "undefined") {
                return;
            }

            /* form 생성한 input 값을 클리어 시킨다.*/
            while (oUI.firstChild) {
                oUI.removeChild(oUI.lastChild);
            }

        },

        onFileAttach: function (oFile) {

            debugger;

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


    };

})();

window.onload = function () {

    oAPP.onStart();

};