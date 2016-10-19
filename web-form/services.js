var webFormApp = angular.module('webFormApp', ['ngRoute', 'ngResource']);

/* hold off this feature for now until we have clarity about nice names 
webFormApp.run(function(webFormService, $rootScope, $http) {
    $http.get('/wp-content/themes/ameriflux/library/web-form/lookup-dictionary.json')
    .then(function(res){
        $rootScope.lookup = res.data;                
    });

});*/

webFormApp.service('webFormService', function($location){
    
    this.getTemplate = function($scope) {
        var dfd = jQuery.Deferred();
        $.ajax({
            method: "GET",
            url: "http://ameriflux-data.lbl.gov/BADMTest/Decode/SiteInfo",
            dataType: "json",
            success: function(data) {
                dfd.resolve(data);
                
            },

            fail: function(data) {
                dfd.resolve(false);
                console.log(data);
            },

            error: function(data, errorThrown) {
                dfd.resolve(false);
                console.log(data);
            },

            timeout: 30000

        });

        return dfd.promise();    
   };

   this.getSiteInfo = function(siteId) {
        var dfd = jQuery.Deferred();

        $.ajax({
            method: "GET",
            url: "http://ameriflux-data.lbl.gov/BADMTest/Anc/SiteInfo/" + siteId,
            dataType: "json",
            $scope: this,
            success: function(data) {
                dfd.resolve(data);
            },

            fail: function(data) {
                dfd.resolve(false);
            },

            error: function(data, errorThrown) {
                dfd.resolve(false);
            },

            timeout: 30000

        });

        return dfd.promise();
   };

   this.getUrlParameter = function (sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0].toLowerCase() === sParam.toLowerCase()) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    this.getCV = function(cvName) {
        var dfd = jQuery.Deferred();

        $.ajax({
            method: "GET",
            url: "http://ameriflux-data.lbl.gov/BADMTest/CV/" + cvName,
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                dfd.resolve(data);
            },

            fail: function(data) {
                console.log(data);
                dfd.resolve(false);
            },

            error: function(data, errorThrown) {
                console.log(data);
                dfd.resolve(false);
            },

            timeout: 30000

        });

        return dfd.promise();
    };

    this.getDeletedList = function(siteId) {
        var deletedList = jQuery.Deferred();

        $.ajax({
            type: 'GET',
            url: "http://ameriflux-data.lbl.gov/BADMTest/Anc/Deleted/" + siteId,
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                deletedList.resolve(data);
            },

            fail: function(data) {
                console.log(data);
                deletedList.resolve(false);
            },

            error: function(data, errorThrown) {
                console.log(data);
                deletedList.resolve(false);
            },

            timeout: 30000

        });

        return deletedList.promise();
    };

    this.updateForm = function(stringifiedObj, dataParam) {
        var saveGrp = jQuery.Deferred();

        $.ajax({
            url: "http://ameriflux-data.lbl.gov/BADMTest/Anc/",
            data: stringifiedObj,
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            dataParam: dataParam,
            success: function (data) {
                if(data.groups[this.dataParam][0].checkAction == 'VALID') {
                    data.result = true; 
                }
                else {
                    data.result = false;
                }
                saveGrp.resolve(data);
            },
            fail: function(data) {
                console.log(errorThrown);
                var errorData = {};
                errorData.result = false;
                errorData.data = data;
                errorData.errorThrown = errorThrown;
                saveGrp.resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                var errorData = {};
                errorData.result = false;
                errorData.jqXHR = jqXHR;
                errorData.textStatus = textStatus;
                errorData.errorThrown = errorThrown;
                saveGrp.resolve(errorData);
            },

            timeout: 30000
        });

        return saveGrp.promise();
    };
});