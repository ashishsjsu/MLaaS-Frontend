'use strict'
// add event listeners as soon as the DOM is ready
$( document ).ready(function(){
	console.log("READY");
	$('#fileupload').on('change', initiateUpload);
	$('.icon-refresh').on('click', refreshFilesList);
	//$('#fileupload').on('click', resetUploader);
	//$('#loadergif').css("visibility", "hidden")	;
	//$('#show-contents').on('click', initiateDownload);
	getCurrentUser();
	refreshFilesList();

	$('.btnStats').attr('disabled', 'disabled');
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
            //Todo: get the file name from the UI
			displayFormattedContent(file.name);
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
	  	refreshFilesList();
	  },
	  error: function(){
	  	alert("Error in mongodb save");
	  }
	});
}

function refreshFilesList() {
	$('ul.treeview-menu li').remove();
	$.getJSON('/files/'+sessionStorage.getItem('username'))
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

function showFileSample(event) {
	console.log(event.target.innerHTML);
	displayFormattedContent(event.target.innerHTML);
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