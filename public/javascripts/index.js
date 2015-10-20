// add event listeners as soon as DOM is ready
/*window.onload = function(){

	console.log("Hello");
	$('#file_input').addEventListener('change', initiateUpload);
	$('#loadergif').style.visibility = "hidden";
	$('#show-contents').addEventListener('click', initiateDownload);
}*/

$( document ).ready(function(){
	console.log("Hello");
	$('#file_input').on('change', initiateUpload);
	$('#loadergif').css("visibility", "hidden")	;
	$('#show-contents').on('click', initiateDownload);

	getCurrentUser();
});


function clearSession(){
	alert("Cleared");
	sessionStorage.clear();
}

function getCurrentUser(){
	$.get("/user/sessionInfo", function(data, status, xhr){
		console.log(data.user.username);
		if(status !== "success"){
			alert("Error occured!");
		}
		setSession(data);
	});
}

function getSession(){
	var username = sessionStorage.getItem('username');
	var email = sessionStorage.getItem('email');
	var user = {
		"username" : username,
		"email": email
	}
	return user;
}

function setSession(data){
	sessionStorage.setItem("username", data.user.username);
	sessionStorage.setItem("email", data.user.email);
}

// this is event handler for upload feature, invoked when a file is selected from the filesystem
function initiateUpload(){

	console.log("File upload initiated");
	var files = $('#file_input')[0].files;
	console.log(files);
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

		console.log(xhr.readyState);
		console.log(xhr.status);
		if(xhr.readyState === 4 && xhr.status === 200){
			var response = JSON.parse(xhr.responseText);
			console.log(response);
			//initiate file upload via browser once request has been signed
			if(flag === 0){
				upload_file(file, response);
			}
			if(flag === 1){
				download_file(response);
			}
		}
		else{
			alert("Could not sign the request. Try again.");
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
            $('#loadergif').css("visibility", "hidden");
            //Todo: get the file name from the UI
			displayFormattedContent("device_ip.csv");
        }
    };
    xhr.onerror = function() {
        alert("Could not upload file.");
    };
    xhr.send(file);
    $('#loadergif').css("visibility", "visible");
}

// this function is meant to invoke the getsigned_reqest method with proper parameters to download a given file
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


function trackUploadProgress(event){
	
	var progressBar = $('#uploadProgress');
	if(event.lengthComputable){
		var progressVal = (event.loaded / event.total) * 100;
		console.log(progressVal);
		progressBar.value = progressVal;
		progressBar.textContent = progressBar.value;
	}
}

function displayFormattedContent(file){

	 var file_url = "https://cmpe295b-sjsu-bigdatasecurity.s3.amazonaws.com/"+file;
	 alert("Displaying the data");
	
	 d3.text(file_url, function(data) {
                var parsedCSV = d3.csv.parseRows(data);

                var container = d3.select("#data-table")

                    .selectAll("tr")
                        .data(parsedCSV).enter()
                        .append("tr")

                    .selectAll("td")
                        .data(function(d) { return d; }).enter()
                        .append("td")
                        .text(function(d) { return d; });

        console.log($('#data-table tr:first'));
        $('#data-table tr:first').css("color", "red");
    });

}