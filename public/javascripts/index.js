'use strict'
// add event listeners as soon as the DOM is ready
$( document ).ready(function(){
	console.log("READY");
	$('#fileupload').on('change', initiateUpload);
	$('.sidebar-menu i.icon-refresh').on('click', refreshFilesList);
	//$('#fileupload').on('click', resetUploader);
	//$('#loadergif').css("visibility", "hidden")	;
	//$('#show-contents').on('click', initiateDownload);
	getCurrentUser();
	$('.btnStats').attr('disabled', 'disabled');
	// bind the list of data sources to the select element in statistics block
	setTimeout(function(){bindDatasourceSelect()}, 3000);
});


/* =========================== User login session retrieval ============================= */
//get the current user info from the node-passport session
function getCurrentUser(){
	$.get("/user/sessionInfo", function(data, status, xhr){
		console.log(data.user.username);
		if(status !== "success"){
			alert("Error occured!");
		}
		setSession(data);
	});
}

//clear session storage
function clearSession(){
	alert("HYYY");
	sessionStorage.clear();
}

//get session data from session storage
function getSession(){
	var username = sessionStorage.getItem('username');
	var email = sessionStorage.getItem('email');
	var user = {
		"username" : username,
		"email": email
	}
	return user;
}

//set the session data in session storage
function setSession(data){
	sessionStorage.setItem("username", data.user.username);
	sessionStorage.setItem("email", data.user.email);
}

/* ===================================== File uploader ==================================== */

function resetUploader(){
	$('#progress .progress-bar').css(
        'width', 0 + '%'
    );
    $('#files').html('');
    //re bind the event bcz above code will rerender the html causing the event to be removed from the element
    $('#fileupload').on('change', initiateUpload);   
}

// this is event handler for upload feature, invoked when a file is selected from the filesystem
function initiateUpload(){

	console.log("File upload initiated");
	var files = $('#fileupload')[0].files;
	var file = files[0];
	if(file == null){
		alert("No file selected");
	}
	else{
		get_signed_request(file, 0);	
	}
}

// returns a pre-signed url for uploading the file to AWS S3
function get_signed_request(file, flag){
	console.log(file);
	var xhr = new XMLHttpRequest();
	var backend_url = "http://127.0.0.1:5000/upload/sign_s3?file_name="+file.name+"&file_type="+file.type;

	xhr.open('GET', backend_url);
	xhr.onreadystatechange = function(){

		if(xhr.readyState === 4 && xhr.status === 200){
			var response = JSON.parse(xhr.responseText);
			
			//initiate file upload via browser once request has been signed
			if(flag === 0){
				upload_file(file, response);
			}
			if(flag === 1){
				download_file(response);
			}
		}
		else{
			//alert("Could not sign the request. Try again.");
		}
	};
	xhr.send();
}

//actual fuction to upload file to S3, needs a file and pre-signed url
function upload_file(file, response){

    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', trackUploadProgress);
    xhr.open("PUT", response.signed_request);
    // the file is publically downloadable
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    xhr.onload = function() {
    	//if file upload request is completed successfully
        if (xhr.status === 200) {
            alert("File upload complete");
            //$('#loadergif').css("visibility", "hidden");
            
            parsePartial(file);
			//displayFormattedContent(file.name);
			//updateUserFiles(file.name);
			updateUserFiles(file);
        }
    };
    xhr.onerror = function() {
        alert("Could not upload file.");
    };
    xhr.send(file);

    list_files(file);
    //$('#loadergif').css("visibility", "visible");
}

//track the uload progress of the file being uploaded to the AWS S3
function trackUploadProgress(data){
	
	var progressBar = $('#uploadProgress');
	if(event.lengthComputable){
		var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#progress .progress-bar').css(
            'width',
            progress + '%'
        );
	}
}

function list_files(file){
	$('<p/>').text(file.name).appendTo($('#files'));
}

/* ================================= Sidebar functionality =================================== */

function updateUserFiles(file){

	alert(file.name + " " + file.type);
	var data = {
		username: sessionStorage.getItem('username'),
		filename: file.name,
		//fileurl : fileurl,
		date: new Date()
	}
	$.ajax({
		type: 'POST',
		url: '/files',
		data: data,
		// use this to something like a loading image
		//beforeSend:		
	  success: function(data){
	  	alert("File saved");
	  	//refreshFilesList();
	  	bindDatasourceSelect();
	  },
	  error: function(){
	  	alert("Error in mongodb save");
	  }
	});
}

// This ajax call returns a promise object, call done on the object to access returned data
function getFileListPromise(){

	return $.getJSON('/files/'+sessionStorage.getItem('username'));
}

// this function refreshes the list of files in the sidebar on index page
function refreshFilesList() {
	$('ul.treeview-menu li').remove();
	//$.getJSON('/files/'+sessionStorage.getItem('username'))
	getFileListPromise()
	.done(function(data) {
		//refresh the list only if number of li elements is not equal to number of files in the object
		if($('ul.treeview-menu li').size() < data.message[0].files.length) {
				$.each(data.message[0].files, function(i, item) {
				
				//dynamically append a list of files to tree view menu
				var li = '<li><a href="#">' + item.filename + '</a>';
				$('ul.menu-open').append(li);
			});
		}
	})
	.fail(function(err) {
		console.log(err);
	})
	.always(function(){
		console.log('Completed');
		//attach event on newly created li elements
		$('#fileslist li a').on('click', showFileSample);
	})
}

// this function displays the data in file when clicked on the file name in the sidebar
function showFileSample(event) {
	displayFormattedContent(event.target.innerHTML);
}

/* ============================== Raw statistics block ============================ */

// bind the list of files to the dropdown in the statistics box
function bindDatasourceSelect() {

	var totalItems = $('.datasource-select option').size();
	getFileListPromise()
	.done(function(data){
		if(totalItems < data.message[0].files.length || totalItems === 1) {
			
			$.each(data.message[0].files, function(i, item){
				
				 $("#datasource-select").append($("<option></option>").val(item.filename).html(item.filename));
			});
		}
	})
	.fail(function(err){

	})
	.always(function(){

	});
}

//handle select even on the data source select element in raw statistics block
$('.datasource-select').change(function(){

	var selected = $(this).find(':selected');
	
	if(selected.index() > 0) {
		$('.btnStats').removeAttr('disabled');
	}
	else{
		$('.btnStats').attr('disabled', 'disabled');	
	}
});

// launch spark task to calculate raw data statistics
$('.btnStats').click(function(){ createDataStatisticsTask() });

// data statistics handler
function createDataStatisticsTask() {

	var filename = $('.datasource-select').find(':selected').val();
	$.getJSON('/files/'+filename+'/statistics')
	.done(function(data){
		//the response here returns the taskname, task id and task status url
		console.log(data);
		//update the task history table here
		updateTaskHistory(data);
	})
	.fail(function(data){
		alert("Task creation failed");
	})
	.always(function(){
		console.log('Completed');
	})
}

/* =================================== Task History Block ===================================== */

//refresh the list of tasks usinf refresh icon in task history block
$('#refresh-history-icon').click(function() {

	console.log($.getJSON('/tasks/'+sessionStorage.getItem('username')));
	alert($.getJSON('/tasks/'+sessionStorage.getItem('username')));
	//ToDo: complete This
});

//this is autoupdated when a new task is created
function updateTaskHistory(data) {

	console.log(Object.keys(data).length);
	//make sure that the object has the task details - at least 2 values in json object
	if(Object.keys(data).length >= 2) {

		var taskname = '<td>' + data.taskname + '</td>';
		var taskid = '<td>' + data.taskid + '</td>';
		var taskstatusurl = '<td>' + data.statusurl + '</td>';
		var created = '<td>' + getToday() + '</td>';
		

		/* var taskname = '<tr><td>' + 'taskname' + '</td>';
		var taskid = '<td>' + 'taskid' + '</td>';
		var taskstatusurl = '<td>' + 'taskstatusurl' + '</td></tr>'; */

		var rows = '<tr>' + taskname + taskid + taskstatusurl + created + '</tr>';
		//append row to the task history table
		$('.task-history > tbody:last').append(rows);
	}
}

/* ===================================  Show file contents ==================================== */

// display the csv file contents as a table
function displayFormattedContent(file){

	//clear existing data
	$('.data-table tbody tr').remove();

	var file_url = "https://cmpe295b-sjsu-bigdatasecurity.s3.amazonaws.com/"+file;
	alert("Displaying the data " + file);

	d3.text(file_url, function(data) {
            var parsedCSV = d3.csv.parseRows(data);
            var container = d3.select("#data-table").select('tbody')

                .selectAll("tr")
                    .data(parsedCSV).enter()
                    .append("tr")

                .selectAll("td")
                    .data(function(d) { return d; }).enter()
                    .append("td")
                    .text(function(d) { return d; });

        $('#data-table tr:first').css("color", "red");  
    });
}

/* ==================== Utility functions ===================== */

function getToday(){

	var today = new Date();
	var date = today.getMonth() + "/" + today.getDate() + "/" + today.getYear() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

	return date;
}

function parsePartial(fileobj) {
	Papa.parse(fileobj, {
			// base config to use for each file
		preview: 10,
		header: true,
		before: function(file, inputElem)
		{
			// executed before parsing each file begins;
			// what you return here controls the flow
		},
		error: function(err, file, inputElem, reason)
		{
			console.log(err);
			console.log(reason);
			// executed if an error occurs while loading the file,
			// or if before callback aborted for some reason
		},
		complete: function(results)
		{
			//console.log(results);
			populatePartialTable(results.meta.fields, results.data);
			// executed after all files are complete
		}
	});
}

function populatePartialTable(headers, data) {

	var thead = null;
	var td = null;
	var trow = '<tr>';

	$.each(headers, function(i, item) { 
		thead = thead + '<th>' + item + '</th>';
	});

	$('.data-table thead').append(thead);
	
	$.each(data, function(i, item){
		console.log(item);
		for(var j=0; j<headers.length; j++) {
			td = '<td>' + item[headers[j]] + '</td>';
			trow = trow + td;
		}
		trow = trow + '</tr>';
		$('.data-table tbody').append(trow);
		trow = '<tr>';		
	});

	//$('.data-table tbody').append(trow);
}

/*// this function is meant to invoke the getsigned_reqest method with proper parameters to download a given file
function initiateDownload(){
	var filename = $("#file-name").value;
	download_file(filename);
}

function download_file(file){
	var xhr = new XMLHttpRequest();
	//Note:download events are fired on xhr object itself
	xhr.addEventListener('progress', trackUploadProgress);
	var file_url = "https://cmpe295b-sjsu-bigdatasecurity.s3.amazonaws.com/"+file;

	xhr.open("GET", file_url);
	xhr.onreadystatechange = function(){
		if(xhr.readyState === 4 && xhr.status === 200){
			alert("Response from S3 server: "+ xhr.responseText);
			displayFormattedContent("device_ip.csv");
		}
		else {
			alert("Could not download the file");
		}		
	}
	xhr.send();
}
*/