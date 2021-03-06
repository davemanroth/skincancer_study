/*
 * @file admin_handler.js
 * Author: Dave Rothfarb
 * Date: 4-4-14
 * Copyright 2014 Health Communication Core
 *
 * This file handles all input and data loading of the ASK admin
 * observation forms that are loaded within cells of the Drupal View.
 * The primary functionality is determining the origin of an admin user's
 * click event within the form and taking the appropriate actions. This 
 * probably could've been implemented more cleanly with Backbone.js but 
 * I didn't have time to learn it and opted to go with what I knew.
 */
(function($){
 $(document).ready(function(){
// First stripe the table rows according to values in either the photo
// status or findings fields and sort them according to the ASK admin
// that's currently viewing
	 var userRoles = Drupal.settings.roles;
	 rowsSetup(userRoles);

// Create div object in which targeted DOM elements related to the clicked 
// item will be stored
	 var div = {};
	 div.form = null;
	 $(document).bind('click', function(e){

// Load all DOM elements native to the admin form which contains the button
// just clicked
		 div.form = $(e.target).parent();
		 var form = div.form;
		 div.row = form.parent().parent();
		 div.values ={
			 role: e.target.name,
			 id: $(form).find('#formid').val(),
			 selected: $(form).find('option:selected').html(),
			 comment: $(form).find('#commentField').val(),
		 };
		 div.tags = {
		   reviewedLabel: $(form).find('label[for="date_reviewed"]'),
		   reviewed: $(form).find('#date_reviewed'),
			 selectLabel: $(form).find('label[for="select"]'),
			 select: $(form).find('#select'),
			 selectVal: $(form).find('option:selected').val(),
			 statusLabel: $(form).find('label[for="status"]'),
			 adminStatus: $(form).find('#status'),
			 commentsLabel: $(form).find('label[for="commentField"]'),
			 commentVal: $(form).find('#comments'),
			 textarea: $(form).find('#commentField'),
		   clear: $(form).find('#clear'),
		   edit: $(form).find('#edit'),
		   cancel: $(form).find('#cancel'),
			};
		 div.arrays = {
       dataArray: [
		     div.tags.reviewedLabel, 
				 div.tags.reviewed, 
				 div.tags.statusLabel, 
				 div.tags.adminStatus, 
				 div.tags.commentVal
			 ],
      formArray: [div.tags.select, div.tags.textarea, div.tags.selectLabel],
		 };

// Add to div arrays now that role is determined
		  var selectId = (div.values.role === 'staff' ? 'status' : 'findings');
		  div.arrays.dataArray.push(form.find('label[for="' + selectId + '"]'));
		  div.arrays.dataArray.push(form.find('#' + selectId));

// Determine the id of the clicked button and trigger corresponding actions
		 switch(e.target.id) {
			 case 'submit':
			 case 'save':
				 if(div.tags.selectVal === '0') {
					 var toSelect = (div.values.role === 'staff' ? 'photo status' : 'finding');
					 warn('You must select a <strong>' + toSelect + '</strong>', false).fadeIn();
				 }
				 else{
// Clear the date and time field in case it already exists
					 div.tags.reviewed.html('');
					 $(e.target).attr({'id' : 'edit', 'value' : 'Edit'});
					 changeRowColor();
					 uploadVals(div.values, selectId);
				   div.tags.cancel.addClass('hidden');
				   div.tags.clear.removeClass('hidden');
				 }
			 break;
		   case 'edit':
				 $(e.target).attr({'id' : 'save', 'value' : 'Save'});
				 editView(div.form, div.tags, selectId);
				 showHide(div.arrays.formArray, div.arrays.dataArray);
				 div.tags.cancel.removeClass('hidden');
				 div.tags.clear.addClass('hidden');
			 break;
		   case 'cancel':
				 $('#save').attr({'id' : 'edit', 'value' : 'Edit'});
				 showHide(div.arrays.dataArray, div.arrays.formArray);
				 div.tags.cancel.addClass('hidden');
				 div.tags.clear.removeClass('hidden');
			 break;
		   case 'closeWarn':
				 e.preventDefault();
				 $('#warn').remove();
			 break;
		   case 'clear':
// Clear entry option and corresponding click handler. View will reset 
// and certain buttons will appear/disappear
				 warn('Are you sure you want to clear all feedback in this table cell??', true).fadeIn();
				 $('#ok').bind('click', function(){
				   var toDelete = {'delete' : true, id : div.values.id, role : div.values.role};
					 uploadVals(toDelete, null);
				   resetView(div.tags);
			     showHide(div.arrays.formArray, div.arrays.dataArray);
					 changeRowColor(div.values.role);
					 div.tags.clear.addClass('hidden');
					 div.tags.edit.attr({'id' : 'submit', 'value' : 'Submit'});
				   $('#warn').remove();
				 });
			 break;
		 }
	 });

// AJAX upload to php script and then format active admin form to reflect data submission
   function uploadVals(values, selectId) {
	   $.ajax({
       url:'/sites/all/modules/custom/ask_admin/includes/upload_data.php',
			 type: 'POST',
       data: values,
			 dataType: 'json',
       success: function(data, status, jqXHR){
			   if(selectId !== null) {
			     loadView(data, selectId);
			     showHide(div.arrays.dataArray, div.arrays.formArray);
				 }
	     },
       error: function(jqXHR, textStatus, errorThrown){
         console.log(errorThrown);
	     }
		 });
	 }

// Load selected data into active admin form for view only
	 function loadView(time, selectId) {
		 var selectTag = div.form.find('#' + selectId);
		 div.tags.reviewed.append(time);
		 $(selectTag).html(div.values.selected);
		 if(div.values.comment != '') {
			 $(div.tags.commentVal).html(div.values.comment);
		 }
	 }

// Revert active admin form from view only to edit mode but load most recent data
   function editView(form, tags, selectId) {
     tags.textarea.html(tags.commentVal.text());
		 var selectText = form.find('#' + selectId).text();
		 tags.select.find('option').each(function(){
			 if($(this).text() == selectText) {
				 $(this).attr('selected', true);
			 }
		 });
	 }

// Clear all data and reset view back to default
   function resetView(tags) {
     tags.textarea.html('');
		 tags.select.find('option[value="0"]').attr('selected', true);
	 }

// Efficiency function to show array elements in first argument and hide array
// elements in second argument
	 function showHide(toShow, toHide) {
		 $(toShow).each(function(){
		   $(this).removeClass('hidden');
		 });
		 $(toHide).each(function(){
		   $(this).addClass('hidden');
		 });
	 }

// Create a container for the purposes of alerting the user with a message
	 function warn(warning, showButton){
		 var warnDiv = $('<div id="warn" class="warn" />');
		 var close = $('<a id="closeWarn" class="closeWarn" href="#">X</a>');
		 var title = $('<h2>Warning!</h2>');
		 var message = $('<p>' + warning + '</p>');
		 var ok = $('<input type="Submit" id="ok" class="form-submit" value="OK" />');
		 $([close, title, message]).each(function(){
		   warnDiv.append($(this));
		 });
		 if(showButton) {
			 warnDiv.append(ok);
		 }
		 $('body').prepend(warnDiv);
		 var leftPos = ($(document).width() / 2) - (warnDiv.width() / 2);
		 warnDiv.css({'left': leftPos}).hide();

		 return warnDiv;
	 }

/*
// This is an old hack to prevent Participant Data from wrapping
// around the floated image. I solved it in the backend but left
// this just in case the backend solution ends up not workng out.
	 function imgBottomMargin(){
		 var imgCells = $('table.views-table td').has('img');
		 imgCells.each(function(){
		   var img = $(this).find('img');
			 var botMarg = $(this).height() - $(img).height() + 5;
			 //console.log(botMarg);
			 $(img).css('margin-bottom', botMarg + 'px');
		 });
	 }
*/


// I know the following 2 row color functions are redundant and could be
// further optimized but I've already had to make several changes based on
// client requests so I opted to leave them be in case of any future mods.
   function rowsSetup(roles){
		 var tbody = $('.views-table tbody');
		 $(tbody).find('tr').map(function(){
			 var findings = $(this).find('#findings');
			 var photoStatus = $(this).find('#status');
			 if($(photoStatus).text() != ''){
				 var isComplete = triggerSource($(photoStatus).text());
				 if(isComplete(/complete|needed/)){
					 $(this).addClass('complete');
					 $(this).removeClass('yellowRow blueRow');
				 }
				 else if($(findings).text() != ''){
					 $(this).removeClass('yellowRow').addClass('blueRow');
					 if(roles.hasOwnProperty(5) && roles[5] == 'ASK study admin'){
						 rowRearrange(tbody, this);
					 }
			   }
				 else {
					 $(this).addClass('yellowRow');
					 if(roles.hasOwnProperty(8) && roles[8] == 'ASK dermatologist'){
						 rowRearrange(tbody, this);
					 }
				 }
			 }//if
		 });//map

		 /*
			* Old row set up code without user roles
			*
     var findings = $('p#findings');
     var photoStatus = $('p#status').filter(':contains(Ready for review)');
		 $('p#status').each(function(){
				 var isComplete = triggerSource($(this).text());
				 if(isComplete(/complete|needed/)){
					 $(this).parent().parent().parent().addClass('complete');
					 $(this).parent().parent().parent().removeClass('yellowRow blueRow');
				 }
			});

		 $(photoStatus).each(function(){
		   $(this).parent().parent().parent().addClass('yellowRow');
		 });
		 $(findings).each(function(){
			 if($(this).text() != ''){
		     $(this).parent().parent().parent().removeClass('yellowRow').addClass('blueRow');
			 }
		 });
		 */
	 }

	 function rowRearrange(tbody, row){
		 var insert = row;
		 $(row).remove();
		 $(tbody).prepend(insert);
	 }

   function changeRowColor(){
		 var styles = {add: '', remove: ''};
		 var selected = div.values.selected;
		 var isReady = isComplete = triggerSource(selected);
		 var isExamined = triggerSource($(div.tags.selectLabel).text());
		 if(isReady(/Ready/)){
			 styles.add = 'yellowRow';
		 }
		 else if(isComplete(/complete|needed/)){
			 styles.add = 'complete';
			 styles.remove = 'yellowRow blueRow';
		 }
		 else if(isExamined('Findings:')){
			 styles.add = 'blueRow';
			 styles.remove = 'yellowRow';
		 }
		 else{
			 styles.remove = 'yellowRow blueRow';
		 }
		 div.row.removeClass(styles.remove).addClass(styles.add);
	 }

	 function triggerSource(source){
	   return function(tester){
		   if(tester instanceof RegExp){
			   return tester.test(source);
			 }
			 else{
				 return tester == source;
			 }
		 }
	 }

 });
})(jQuery);

