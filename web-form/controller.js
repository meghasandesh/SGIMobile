webFormApp.controller('WebFormCtrl', function ($scope, webFormService, $routeParams, $location, $route, $compile, $filter, $http) {

  $scope.siteId = webFormService.getUrlParameter('site_id'),
  $scope.targetGroup = webFormService.getUrlParameter('group'),
  //$scope.basePath = 'web-submit-ui';

  $(window).bind("beforeunload", function() { 
      return confirm("Do you really want to close?"); 
  });

  $scope.showWarning = function() {

  };

  $scope.toggleOverlay = function() {
    $('.js-overlay').toggle();
    $('.js-article').toggle();
  }

  $scope.showOverlay = function() {
    $('.js-overlay').show()
                    .removeClass('hide');
    $('.js-article').hide();
  }

  $scope.hideOverlay = function() {
    $('.js-overlay').hide();
    $('.js-article').show()
                    .removeClass('hide');
  }

  $.when(webFormService.getTemplate(), webFormService.getSiteInfo($scope.siteId), webFormService.getDeletedList($scope.siteId)).done(function(template, siteInfo, deletedList) {
    if(siteInfo && template) {

      $scope.siteInfo = siteInfo;
      $scope.updatedGroupCounts = siteInfo.counts;
      $scope.template = template;
      $scope.deletedList = deletedList;
      $scope.lists = {};
      $scope.cvCount = 0, $scope.cvFetched = 0;
      $scope.elementPosition = null;
      $scope.editMode = false;
      $scope.deleteEntry = null;
      $scope.eventHandle = null;
      $scope.cvDesc = {};

      for(var grpkey in siteInfo.values['GRP_HEADER']) {
        $scope.siteId = siteInfo.values['GRP_HEADER'][grpkey].SITE_ID;
        $scope.siteName = siteInfo.values['GRP_HEADER'][grpkey].SITE_NAME;
      }
      
      for(var group in template.groups) {
        for(var param in template.groups[group]) {
          if(template.groups[group][param].hasCV) {
            $scope.cvCount++;
          }
        }
      }

      $scope.$apply();

    }

    else if(!template) {
      $scope.hideOverlay();
      $scope.setModalContent('Error','The page template could not be loaded. Please try again later.','bg-danger');
    }
    else if(!siteInfo){
      $scope.hideOverlay();
      $scope.setModalContent('Error','The data for this site could not be loaded. Please try again later.','bg-danger');
    }
    else {
      $scope.hideOverlay();
      $scope.setModalContent('Error','Something went wrong and the page cannot be loaded. Please try again later.','bg-danger');
      $scope.$apply();
    }
    
  });

  $scope.disableButtons = function() {
    $('.js-edit-entity-btn, .js-del-entity-btn, .js-add-element, .js-history-btn').addClass('disabled');
    $('textarea').css('height', 'auto')
                 .flexible();
    $scope.editMode = true;
  };

  $scope.enableButtons = function() {
    $('.js-edit-entity-btn, .js-del-entity-btn, .js-add-element, .js-history-btn').removeClass('disabled');
    $scope.editMode = false;
  };

  $scope.stripCharacters = function(string, charactersToStrip, replacementCharacter) {
      if(replacementCharacter) {
          return string.split(charactersToStrip).join(replacementCharacter);
      }
      return string.split(charactersToStrip).join("");
  };

  $scope.getNiceName = function(attribute, listName, tooltip) {
    var niceName = '';

    if($scope.lookup) {

      if(listName) {
        attribute = attribute.toLowerCase();
        var niceName = $scope.lookup[listName][attribute];
      }

      if(niceName) {
        if(typeof niceName == 'object') {
          if(tooltip) {
            return niceName.description;
          }
          else {
            return niceName.value; 
          }
        }
        else if(typeof niceName == 'string'){
          return niceName;
        }
      }

      if(!niceName || !listName) {
        attribute = $scope.stripCharacters(attribute.toLowerCase(), "grp_");
        attribute = $scope.stripCharacters(attribute, "_", ' ');
        return attribute;
      }
    }
    else {
      return attribute;
    }

  };

  $scope.getGroupCount = function(groupName) {
    if($scope.updatedGroupCounts) {
      return ($scope.updatedGroupCounts[groupName] ? $scope.updatedGroupCounts[groupName] : 0);
    }
    else {
      return ($scope.siteInfo.counts[groupName] ? $scope.siteInfo.counts[groupName] : 0);
    }
  };

  $scope.getPageTitle = function() {
    if($scope.template) {
      if($scope.template.template_name == 'SiteInfo') {
        return 'Site General Info: ' + $scope.siteId + ' ' + $scope.siteName;
      }
    }
  };

  $scope.setModalContent = function(header, string, headerClass) {
    $('#myModal .modal-header').removeClass('bg-danger bg-warning bg-success');
    if(headerClass) {
      $('#myModal .modal-header').addClass(headerClass + ' modal-header');
    }
    $('#myModal .modal-header').html(header);
    $('#myModal .modal-body').html(string);
    $('#myModal').modal();
  };

  $scope.setConfirmModal = function() {
    
    if($scope.eventHandle) {
      $('#delete-modal .js-entry').html('');
      var dataParam = $scope.eventHandle.closest('.js-content-section').attr('data-param');
      $('#delete-modal .js-data-param').html('').html(dataParam);
      $scope.eventHandle.closest('.js-content-section').find('input, textarea, select').each(function() {
        var value = $(this).val() ? $(this).val() : '<span class="text-muted">Not provided</span>';
        $('#delete-modal .js-entry').append($(this).attr('data-param') + ': ' + value + '<br>');
      });
    }
    $('#delete-modal').modal();
  };

  $scope.getCV = function(cvName, paramName, cvType) {
    if(!$scope.lists[cvName]) {
      $scope.lists[cvName] = cvName;
      $scope.cvDesc[cvName] = {};
      $.when(webFormService.getCV(cvName)).done(function(cvData) {
        if(cvData) {
          $scope.cvDesc[cvName] = cvData.vocabulary;
          var html = '',
          defaultOption = '<option value="select" disabled selected>Select ' + paramName + '</option>';
          if(cvType == 's') {
            defaultOption = '<option class="drop-down-option" value="" selected>None</option>';
          }
          else if(!cvType) {
            defaultOption += '<option class="drop-down-option" value="">None</option>';
          }
          for(var option in cvData.vocabulary) {
            html += '<option class="drop-down-option" value="'+option+'">'+option+'</option>';
          }

          html = defaultOption + html;

          $('select[data-param="'+paramName+'"]').html(html);
        }
        else {
          $scope.setModalContent('Error', 'The dropdown list for <b>' + cvName + '</b> could not be loaded. Please refresh the page or try again later.', 'bg-danger');
        }

        if(cvData) {
          $scope.cvFetched++;
          if($scope.cvFetched == $scope.cvCount) {
              
            $.when($scope.populatePage()).done(function() {
              $scope.$apply();
              $('.DATE').datepicker({
                dateFormat: 'yymmdd',
                changeMonth: true,
                changeYear: true,
                showButtonPanel: true
              });
              $('.js-overlay').hide();
              $('.js-article').removeClass('hide');
              $('.js-tooltip').popover({html: true, trigger: 'hover focus', placement: 'auto'});
              $('textarea').flexible();
              if($scope.targetGroup) {
                var targetY = $('.js-collapsible-section[data-group="' + $scope.targetGroup + '"]')[0].offsetTop;
              }
              $(window).scrollTop(targetY);
            });
            
          }
        }

      });
    }
  };

  $scope.showWarningMsg = function() {
    $scope.setModalContent('Warning', 'Please save your entry before editing others', 'bg-warning'); 
    var editPosY = $('.js-content-section.edit').offset().top - 50;
    if(editPosY < 0) {
      editPosY = 0;
    }
    $('html, body').animate({
                    scrollTop: editPosY
                }, 500);
  }

  $scope.viewHistory = function(event) {
    var dataParam = $(event.target).closest('.js-content-section').attr('data-param');
    $('#history-modal .js-grp').html(dataParam);
    $('#history-modal').modal();
  };

  $scope.clearInputs = function(element) {
    $(element).find('input, textarea').each(function() {
        $(this).val('');
    });

    $(element).find('option[value="select"]').prop("selected", true);
  };

  $scope.initDeleteEntity = function(event) {
    if($scope.editMode) {
      return;
    }
    $scope.eventHandle = $(event.target);
    $scope.setConfirmModal();
  }

  $scope.deleteEntity = function() {

    if($scope.editMode) {
      //$scope.setModalContent('Warning', 'Please save your current entry before deleting others', 'bg-warning'); 
      $scope.showWarningMsg();
      return;
    }

    if($scope.eventHandle) {

      var dataParam = $scope.eventHandle.closest('.js-content-section').attr('data-param');
      var ancDataId = $scope.eventHandle.closest('.js-content-section').attr('data-anc-data-id');
      var submitObject = {};
      submitObject.SITE_ID = $scope.siteId;
      submitObject.submitUserID = $scope.userId;
      submitObject.groups = {};
      submitObject.groups[dataParam] = [];

      submitObject.groups[dataParam].push({grpkey: ancDataId, Action: 'DELETE', values:{}});

      $scope.toggleOverlay();
      $.when(webFormService.updateForm(JSON.stringify(submitObject), dataParam)).done(function(updateState) {
        if(updateState) {
          var param = $scope.eventHandle.closest('.js-content-section').attr('data-param');
          if(updateState.result && updateState.groups[param][0].checkAction != "REJECT") {
            $scope.eventHandle.closest('.js-content-section').remove();
            var groupName = $scope.eventHandle.closest('.js-content-section').attr('data-param');
            if($scope.updatedGroupCounts[groupName] && $scope.updatedGroupCounts[groupName] > 0) {
              $scope.updatedGroupCounts[groupName]--;
            }
          }
          $scope.handleUpdate(updateState);
          $scope.eventHandle = null;
        }
        else {
          $scope.setModalContent('Error', 'Your changes could not be saved. Please try again later.', 'bg-danger');
        }
      });
      $scope.enableButtons();
    }
  };

  $scope.editEntity = function(event) {

    if($scope.editMode) {
      //$scope.setModalContent('Warning', 'Please save your entry before editing others', 'bg-warning'); 
      $scope.showWarningMsg();
      return;
    }

    $scope.elementPosition = $(event.target).closest('.js-content-section')
                                            .prevAll('.js-content-section').length;

    var insertPosition = '';

    if($(event.target).closest('.js-collapsible-section').find('.js-show-deleted').length > 0) {
      insertPosition = $(event.target).closest('.js-collapsible-section').find('.js-show-deleted');
    }
    else {
      insertPosition = $(event.target).closest('.js-collapsible-section').find('.js-add-entry');
    }

    if($scope.elementPosition > 0) {

      $(event.target).closest('.js-content-section')
                      .detach()
                      .insertAfter(insertPosition);
    }
    $(event.target).closest('.js-content-section')
                  .removeClass('saved-entity js-saved-entity')
                  .addClass('edit')
                  .css('height', '')
                  .find('textarea').flexible();

    var scrollPosition = $(event.target).closest('.js-collapsible-section').offset().top;
    $('html, body').animate({
                    scrollTop: scrollPosition
                }, 300);
    $scope.disableButtons();

  };

  $scope.saveEntity = function(event) {
    var save = true;
    var secondaryCondition = true, hasSecondary = false;
    var dataParam = $(event.target).closest('.js-content-section').attr('data-param');
    var ancDataId = $(event.target).closest('.js-content-section').attr('data-anc-data-id');
    var submitObject = {};
    submitObject.SITE_ID = $scope.siteId;
    submitObject.submitUserID = $scope.userId;
    submitObject.groups = {};
    submitObject.groups[dataParam] = [];
    //submitObject.groups[dataParam].push({values:{}});
    

    if(ancDataId) {
      submitObject.groups[dataParam].push({grpkey: ancDataId, Action: 'UPDATE', values:{}});
    }
    else {
      submitObject.groups[dataParam].push({grpkey: ancDataId, Action: 'SUBMIT', values:{}});
    }

    $(event.target).closest('.js-content-section').find('.js-req-msg').each(function() {
      $(this).hide();
    });

    if($(event.target).closest('.js-content-section').find('.js-secondary').length > 0) {
      secondaryCondition = false;
      hasSecondary = true;
    }

    $(event.target).closest('.js-content-section').find('input, textarea, select').each(function() {
      var param = $(this).attr('data-param'), 
      val = $(this).val() ? $(this).val().trim() : false;
      if($(this).attr('data-req') == 'true' && !val) {
        save = false;
        $(this).closest('.js-content-section').find('.js-req-msg.' + param).show();  
      }

      //$(this).siblings('.js-value-holder.' + param).html($(this).val());
      if(val) {
        submitObject.groups[dataParam][0].values[param] = {};
        submitObject.groups[dataParam][0].values[param].dataValue = val;
        $(this).siblings('.js-null-holder' + '.' + param).addClass('hide');
        if($(this).hasClass('js-secondary')) {
          secondaryCondition = true;
        }

      }
      else {
        $(this).siblings('.js-null-holder' + '.' + param).removeClass('hide');
      }
            
    });

    if(hasSecondary) {
      save = save && secondaryCondition;
    }

    if(save) {
      $.when(webFormService.updateForm(JSON.stringify(submitObject), dataParam)).done(function(updateState) {

        if(updateState) {
          var updateResult = $scope.handleUpdate(updateState, ancDataId, $(event.target).closest('.js-content-section'));
          if(updateResult) {
            $(event.target).closest('.js-content-section').addClass('saved-entity js-saved-entity filled')
                                                          .removeClass('edit bg-warning');
            if($scope.elementPosition > 0) {

              var insertPosition = $(event.target).closest('.js-collapsible-section')
                                                  .find('.js-content-section')[$scope.elementPosition];
              $(event.target).closest('.js-content-section')
                              .detach()
                              .insertAfter(insertPosition);
            }

            $scope.elementPosition = null;
            $scope.enableButtons();
            $scope.removeLabels();

            var groupName = $(event.target).closest('.js-collapsible-section').find('.js-content-section').attr('data-param');
            if($scope.updatedGroupCounts[groupName]) {
              $scope.updatedGroupCounts[groupName]++;
            }
            else {
              $scope.updatedGroupCounts[groupName] = 1;
            }
          }
          else {
            //$scope.toggleOverlay();
          }
        }
        else {
          $scope('Fatal Error', 'Your changes could not be saved. Please try again later', 'bg-danger');
        }
      });

      //$scope.toggleOverlay();
      
    }

    else
    {
      //$scope.toggleOverlay();
      if(!secondaryCondition && hasSecondary) {
        $scope.setModalContent('Error', 'Please fill at least one value to save this entry', 'bg-danger'); 
      }
      
    }
    $scope.hideOverlay();
          
  };

  $scope.clearEntity = function(event) {
    $scope.clearInputs($(event.target).closest('.js-content-section'));
    $scope.enableButtons();
  };

  $scope.clearChanges = function(event) {

    if($(event.target).closest('.js-content-section').hasClass('filled')) {
      $(event.target).closest('.js-content-section').find('input, textarea, select').each(function() {
        var param = $(this).attr('data-param');
        $(this).val($(this).siblings('.js-value-holder.' + param).html());
      });

      $(event.target).closest('.js-content-section').addClass('saved-entity js-saved-entity')
                                                    .removeClass('edit');

      if($scope.elementPosition > 0) {

        var insertPosition = $(event.target).closest('.js-collapsible-section')
                                            .find('.js-content-section')[$scope.elementPosition];
        $(event.target).closest('.js-content-section')
                        .detach()
                        .insertAfter(insertPosition);
      }
      $scope.enableButtons();
    }
    else {
      $scope.enableButtons();
      $(event.target).closest('.js-content-section').remove();
    }
    $scope.elementPosition = null;
    //$.fn.matchHeight._update();
    $scope.removeLabels();
  };

  $scope.addEntity = function(event) {
    if($scope.editMode) {
      //$scope.setModalContent('Warning', 'Please save your entry before editing others', 'bg-warning'); 
      $scope.showWarningMsg();
      return;
    }

    var insertAfter = $(event.target).closest('.js-add-entry');
    var element = $(event.target).closest('.js-collapsible-section')
                  .find('.js-content-section.js-group-template')
                  .clone()
                  .attr('data-anc-data-id', '');
    element.removeClass('js-group-template hidden')
          .addClass('edit')
          .insertAfter(insertAfter);
    element.find('.DATE').each(function() {
      $(this).removeClass('hasDatepicker')
            .removeAttr('id')
            .datepicker({
                dateFormat: 'yymmdd',
                changeMonth: true,
                changeYear: true,
                showButtonPanel: true
              });
    });
    element.find('.js-tooltip').popover({html: true, trigger: 'hover focus', placement: 'auto'});
    element.find('textarea').flexible();
    $compile(element.find('.js-button-bar').contents())($scope);
    var groupName = $(event.target).closest('.js-collapsible-section').find('.js-content-section').attr('data-param');
    $scope.disableButtons();
  };

  $scope.getSortedArray = function(collection) {
    var returnArray = [];
    for(object in collection) {
      collection[object].ANC_DATA_ID = object; 
      returnArray.push(collection[object]);
    }
    returnArray = $filter('orderBy')(returnArray, 'SEQUENCE');

    return returnArray;
  };

  $scope.populatePage = function() {

    if($scope.siteInfo) {

      for(var property in $scope.siteInfo.values) {
        $scope.siteInfo.values[property] = $scope.getSortedArray($scope.siteInfo.values[property]);
        for(var i=0; i < $scope.siteInfo.values[property].length; i++) {

            var objectToCopy = $('.js-content-section.js-group-template[data-param="'+ property +'"]').first();
            var dataTemplate = objectToCopy.clone();
            $scope.clearInputs(dataTemplate);
            for(var param in $scope.siteInfo.values[property][i]) {
              
              if($scope.siteInfo.values[property][i][param]) {
                dataTemplate.find('.js-null-holder' + '.' + param).addClass('hide');

                if(dataTemplate.find('select').filter('.' + param).length > 0) {
                  var assignVal = false;
                  dataTemplate.find('select').filter('.' + param).find('option').each(function() {
                    if($(this).val().toLowerCase() == $scope.siteInfo.values[property][i][param].trim().toLowerCase()) {
                      $(this).prop('selected', 'true');
                      assignVal = true;
                    }
                    if(assignVal) {
                      dataTemplate.find('.js-value-holder' + '.' + param).html($scope.siteInfo.values[property][i][param].trim());
                    }
                  });
                }
                else {
                  dataTemplate.find('input, textarea').filter('.' + param).val($scope.siteInfo.values[property][i][param].trim());
                  dataTemplate.find('.js-value-holder' + '.' + param).html($scope.siteInfo.values[property][i][param].trim());
                }
              }
            }
            if($scope.siteInfo.values[property][i].grpstate == 'PENDING') {
              dataTemplate.find('.js-pending-label').removeClass('hide');
            }
            dataTemplate.removeClass('js-group-template hidden').addClass('saved-entity js-saved-entity filled');
            dataTemplate.attr('data-anc-data-id', $scope.siteInfo.values[property][i].ANC_DATA_ID);
            $compile(dataTemplate.find('.js-button-bar').contents())($scope);
            $('.js-content-section[data-param="'+ property +'"]').last().before(dataTemplate);             
        }
      }

      $('.js-only-one').each(function() {
        $(this).closest('.js-content-section').addClass('only-one');
      });

    }

  };

  $scope.toggleButton = function(group, groupName) {
    var lengthCondition = false, onlyOne = false, objectExists;
    for(var prop in group) {
      onlyOne = group[prop].keep_value == 'OnlyOne';
    }
    
    if($scope.updatedGroupCounts) {
      objectExists = $scope.updatedGroupCounts[groupName] > 0; 
    }
    else {
      objectExists = $scope.siteInfo.counts[groupName] > 0;
    }

    return !(onlyOne && objectExists);
    
  };

  $scope.saveAllChanges = function() {
    var submitObject = {};
    submitObject.SITE_ID = $scope.siteId;
    submitObject.submitUserID = $scope.userId;
    submitObject.groups = {};
    var dataParam = '';
    var save = true;

    $('.js-collapsible-section').each(function() {
      $(this).find('.js-content-section').each(function(index) {
        if($(this).attr('data-param') && $(this).attr('data-anc-data-id')) {
          var ancDataId = $(this).attr('data-anc-data-id');
          dataParam = $(this).attr('data-param');
          if(!submitObject.groups[dataParam]) {
            submitObject.groups[dataParam] = new Array();
          }
          
          submitObject.groups[dataParam].push({grpkey: ancDataId, values:{}});
          $(this).find('input, textarea, select').each(function() {   
            var param = $(this).attr('data-param');
            if($(this).attr('data-req') == 'true' && !$(this).val()) {
              save = false;
              $('.js-content-section[data-anc-data-id="'+ancDataId+'"]').addClass('bg-warning');
              $(this).closest('.js-content-section').find('.js-req-msg.' + param).show();  
            }
            else if($(this).val()) {
              submitObject.groups[dataParam][index].values[param] = new Object();
              submitObject.groups[dataParam][index].values[param].dataValue = $(this).val();
            }
          });
        }
      });
    });

    console.log(submitObject);
    if(save) {
      $scope.toggleOverlay();
      $.when(webFormService.updateForm(JSON.stringify(submitObject), dataParam)).done(function(updateState) {
        if(updateState) {
          $scope.setModalContent('Error', 'Your changes could not be saved. Please try again later', 'bg-danger');
        }
        else {
          $scope.handleUpdate(updateState);
        }
      });
    }
    else {
      $scope.setModalContent('Error', 'Your entry has errors. Please correct them', 'bg-danger');     
    }
  }

  $scope.monitorChange = function() {
  };

  $scope.getParamCount = function(group) {
    console.log(Object.keys(group).length);
    return Object.keys(group).length;
  }

  $scope.showDeletedEntries = function(groupName) {
    console.log(groupName);
    console.log($scope.deletedList);
    var msgBody = '';
    for(var group in $scope.deletedList.values) {
      if(group == groupName) {
        for(var entry in $scope.deletedList.values[group]) {
          var text = '<div class="js-deleted-entry">';
          text += '<button class="js-restore-btn restore-btn btn btn-default" data-param="'+ group +'" data-grpkey="'+ entry + '">'+ 'Restore' + '</button>';
          text += 'Deleted by ' + $scope.deletedList.values[group][entry].modifiedBy + ' on ' +  $scope.deletedList.values[group][entry].lastModified + '<br>';
          text += '<p>';
          for(var prop in $scope.deletedList.values[group][entry]) {
            if(prop == 'lastModified' || prop == 'modifiedBy') {
              ;
            }
            else {
              text += '<span class="js-value-holder hide" data-param="' + prop +'">' + $scope.deletedList.values[group][entry][prop] + '</span>';
              text += '<b>' + prop + '</b>' + ': ' + $scope.deletedList.values[group][entry][prop] + '<br>';
            }
          }
          text += '</p></div><br>';
          msgBody += text;
        }
      }
    }
    $scope.setModalContent('Deleted Entries for ' + '<b>' + groupName + '</b>', msgBody);
  }

  $scope.handleUpdate = function(updateState, level, entity) {
    var returnVal = true;
    var dataId = '';
    var failMsg = '';
    var dataParam = '';

    if(!updateState.result) {
      returnVal = false;
      if(updateState.errorThrown && updateState.jqXHR.responseJSON.ExceptionMessage) {
        failMsg += updateState.errorThrown + ': ' + updateState.jqXHR.responseJSON.ExceptionMessage;
      }
      else {

        for(var param in updateState.groups) {
          dataParam = param;
          if(updateState.groups[param][0].checkAction == 'REJECT') {
            if(updateState.groups[param][0].checkComment.indexOf('ancgrpkey not in SiteDataDisplay') != -1) {
              failMsg += 'ERROR: This entry is out of date. Please refresh the page.' + '<br>';
            }
            else {
              failMsg += updateState.groups[param][0].checkComment + '<br>';
            }
            

            for(var key in updateState.groups[param][0].values) {
              if(updateState.groups[param][0].values[key].checkAction == 'REJECT') {
                failMsg += '<b>' + key + '</b>' + ': ' + updateState.groups[param][0].values[key].checkComment + '<br>';
              }
            }
          }
        }
      }
    }
    else if(updateState.result) {
      for(var group in updateState.groups) {

        $.each(updateState.groups[group], function(index, object) {
          dataParam = group;
          var ancDataId = object.ancdataID;
          if(object.checkAction == 'REJECT') {
            if(object.checkAction.indexOf('ancgrpkey not in SiteDataDisplay') != -1) {
              failMsg += 'ERROR: This entry is out of date. Please refresh the page.' + '<br>';
            }
            else {
              failMsg += object.checkComment + '<br>';
            }

            for(var key in object.values) {
              if(object.values[key].checkAction == 'REJECT') {
                failMsg += '<b>' + key + '</b>' + ': ' + object.values[key].checkComment + '<br>';
              }
            }

            dataId = level ? level : ancDataId;
            if(!dataId) {
              $('.js-content-section[data-anc-data-id="'+dataId+'"]').addClass('bg-warning');
            }
            else {
              $(entity).addClass('bg-warning');
            }
            returnVal = false;
          }

          for(var param in object.values) {
            if(object.values[param].checkAction == 'REJECT') {
              if(!dataId) {
                $(entity).find('.js-input-group.'+param).addClass('bg-danger');
                $(entity).find('.js-input-group.'+param+' '+'.js-error-msg').html(object.values[param].checkComment)
                                                                            .removeClass('hide');
              }
              else {
                $('.js-content-section[data-anc-data-id="'+dataId+'"]').find('.js-input-group.'+param).addClass('bg-danger');
                $('.js-content-section[data-anc-data-id="'+dataId+'"]').find('.js-input-group.'+param+' '+'.js-error-msg').html(object.values[param].checkComment)
                                                                                                                          .removeClass('hide');
              }
            } 
          };
        });
      }
    }

    if(returnVal) {
      $scope.hideOverlay();
      $scope.setReloadPage(dataParam);
      $scope.setModalContent('Success', 'Your changes have been saved', 'bg-success');
    }
    else {
      $scope.hideOverlay(dataParam);
      $scope.setModalContent('Error', failMsg, 'bg-danger');
    }
    return returnVal;
  };

  $scope.toggleEntities = function() {
    if($(event.target).hasClass('js-toggle-btn')) {
      $(event.target).toggleClass('up');
    }
    $(event.target).children('.js-toggle-btn').toggleClass('up');
    $(event.target).closest('.js-collapsible-section').find('.js-saved-entity, .js-add-element, .js-show-deleted').each(function() {
      $(this).toggle();
    });

  };

  $('body').on('click', '.js-showCVDesc', function(event) {
    var cvName = $(event.currentTarget).attr('data-cv');
    var descTitle = '<h3>Description of <b>' + cvName + '</b> options:</h3>';
    var descText = '';
    for(var option in $scope.cvDesc[cvName]) {
      descText += '<p>';
      descText += '<b>' + option + '</b><br>' + $scope.cvDesc[cvName][option].description;
      descText += '</p>';
    }
    $scope.setModalContent(descTitle, descText);
  });

  $('body').on('click', '.js-restore-btn', function(event) {
    var grpkey = $(event.currentTarget).attr('data-grpkey');
    var dataParam = $(event.currentTarget).attr('data-param');
    var submitObject = {};
    submitObject.SITE_ID = $scope.siteId;
    submitObject.submitUserID = $scope.userId;
    submitObject.groups = {};
    submitObject.groups[dataParam] = [];

    $scope.showOverlay();

    submitObject.groups[dataParam].push({grpkey: grpkey, Action: 'UNDELETE', values:{}});
    for(var group in $scope.deletedList.values) {
      if(group == dataParam) {
        for(var entry in $scope.deletedList.values[group]) {
          if(grpkey == entry) {
            //submitObject.groups[dataParam][0].values[grpkey] = new Object();
            for(var prop in $scope.deletedList.values[group][entry]) {
              if(prop == 'lastModified' || prop == 'modifiedBy') {
                ;
              }
              else {
                submitObject.groups[dataParam][0].values[prop] = $scope.deletedList.values[group][entry][prop];
              }
            }
          }
        }
      }
    }

    $.when(webFormService.updateForm(JSON.stringify(submitObject), dataParam)).done(function(updateState) {
      console.log(updateState);
      var dataParam = '';
      if(updateState) {
        if(updateState.result) {
          for(var param in updateState.groups) {
            dataParam = param;
          }
          $scope.hideOverlay();
          $scope.setReloadPage(dataParam);
          $scope.setModalContent('Success', 'This entry has been restored', 'bg-success');
        }
        else {
          $scope.handleUpdate(updateState);
        }
      }
      else {
        $scope.setModalContent('Error', 'Your changes could not be saved. Please try again later', 'bg-danger');
      }
    });
    console.log(submitObject);

  });

  $scope.restoreEntry = function(grpkey) {
    
  };

  $scope.removeLabels = function() {
    $('.js-error-msg').hide();
    $('.js-req-msg').hide();
    $('.js-input-group').removeClass('bg-warning bg-danger');
  };

  $scope.setReloadPage = function(dataParam) {
    
    $(window).unbind("beforeunload");
    
    $("#myModal").on("hidden.bs.modal", function () {
        $scope.showOverlay();
        var targetURL = '/?' + 'site_id=' + $scope.siteId;
        if(dataParam) {
          targetURL += '&' + 'group=' + dataParam;
        }
        window.location.assign(targetURL);
    });
  }
});
