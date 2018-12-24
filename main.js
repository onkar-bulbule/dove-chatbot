(function() {
	//Initialisation of important variables
	var baseUrlDialogflow = "https://api.dialogflow.com/v1/";
	var baseUrlCity = "http://ip-api.com/json?fields=city";
	var baseUrlWeather = "http://api.worldweatheronline.com/premium/v1/weather.ashx?key=35e63960b7de407aa91132542182012";
	var clientIDDialogflow = "4e45014f3f314a36b6de75a8be0e0449";
	var currentVpWidth = $(window).width();
	
	function getDesiredValue(url){
		return $.getJSON(url);
	}
	
	function handlePosition(position) {
		var lat = Math.round(position.coords.latitude);
		var long = Math.round(position.coords.longitude);
		
		$.when(getDesiredValue(baseUrlCity), getDesiredValue(baseUrlWeather+"&q="+lat+","+long+"&num_of_days=1&tp=3&format=json")).done(function(cityInfo, tempInfo){
			console.log();
			introText.message = "Hi, it is "+tempInfo[0].data.current_condition[0].temp_C+" degrees outside in "+cityInfo[0].city+". How is your hair feeling?";
			introText.render('intro');
		});
	}
	
	
	//Constructing Carousel
	function makeCarousel(carouselObj) {
		var carouselWidth = currentVpWidth*0.6;
		
		$(carouselObj).width(carouselWidth);
		
		var carouselWrapper = $(carouselObj).children('.carousel-wrapper')[0];
		var slidesWrapper = $(carouselWrapper).children('.slides-wrapper')[0];
		var numOfSlides = $(slidesWrapper).children().length;
		
		$(slidesWrapper).width(carouselWidth * numOfSlides);
		$(slidesWrapper).children('.carousel-slide').width(carouselWidth);
		
		var arrows = $(carouselWrapper).append('<div class="carousel-arrows"><div class="prev"></div><div class="next"></div></div>');
		
		var wayfinderList = '';
		for(let i = 0; i < numOfSlides; i++) {
			wayfinderList = wayfinderList + "<li class='wayfinder-dot' data-index='"+i+"'></li>";
		}
		$(carouselWrapper).append("<ul class='wayfinders'>"+wayfinderList+"</ul>");
		
		goToSlide(0);
		
		$(carouselWrapper).find('.wayfinders').on('click', '.wayfinder-dot', function() {
			goToSlide($(this).attr('data-index'));
		});
		
		$(carouselWrapper).find('.carousel-arrows').on('click', '.prev', function(){
			if($(slidesWrapper).attr('current-slide') === '0') {
				goToSlide((numOfSlides-1));
			}
			else
				goToSlide(Number($(slidesWrapper).attr('current-slide')) - 1);
		});
		
		$(carouselWrapper).find('.carousel-arrows').on('click', '.next', function(){
			if($(slidesWrapper).attr('current-slide') == (numOfSlides-1)) {
				goToSlide(0);
			}
			else
				goToSlide(Number($(slidesWrapper).attr('current-slide')) + 1);
		});
		
		function goToSlide(targetIndex) {
			var calcTransform = targetIndex * carouselWidth;
			$(slidesWrapper).css({
				'transform' : 'translateX(-'+calcTransform+'px)'
			});
			$(slidesWrapper).attr('current-slide', targetIndex);
			
			var wayfinderdots = $(carouselObj).find('.wayfinder-dot');
			$(wayfinderdots[targetIndex]).siblings().removeClass('selected');
			$(wayfinderdots[targetIndex]).addClass('selected');
		}
	}
	
	
	//Using Google's Dialogflow for better User input scanning
	
	function nlpUserInput(userInput){
		return $.ajax({
			type: "POST",
			url: baseUrlDialogflow + "query?v=20150910",
      contentType: "application/json; charset=utf-8",
			dataType: "json",
			headers: {
				"Authorization": "Bearer " + clientIDDialogflow
			},
			data: JSON.stringify({ query: userInput, lang: "en", sessionId: "somerandomthing" })
		});
	}
	
	
	
	
	$('#intro-image').addClass('fadeOut');
	
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(handlePosition);
  } else {
		alert("Geolocation is not supported by this browser. Detecting location and temperature isn't possible.");
  }
	
	//Initialising the dove-video ahead since it'll take a lot of time if done on demand
	
	$('#dove-video').append('<iframe width="'+currentVpWidth*0.5+'" height="'+currentVpWidth*0.3+'" src="https://www.youtube.com/embed/wsoN2C0JzWk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
	
	
	//Initialising the dove-carousel ahead since it'll take a lot of time if done on demand
	
	makeCarousel($("#dove-carousel"));
	
	
	//Initialising all the system/user input message blocks. Main messageBlock is created, to which all the other message objects are linked
	
	var prevMessage;
	
	var messageBlock = {
		render: function(messageRole, message) {
			this.message = this.message || message;
			this.role = messageRole;
			var markup = "<div class='message-block' data-role='"+messageRole+"'>"+this.message+"</div>";
			$("#messages-wrapper").append(markup);
			
			if(this.callback){
				this.callback();
			}
			
			this.message = messageRole === 'user-input' ? null : this.message;
		}
	};
	
	var introText = Object.create(messageBlock);
	
	var userInput = Object.create(messageBlock);
	
	var videoRecommend = Object.create(messageBlock);
	videoRecommend.message = "I recommend you use Dove Oxygen Moisturiser for even better results!";
	videoRecommend.callback = function(){
		var result = $('#dove-video').wrap("<div class='message-block'></div>");
		$(result).parent().appendTo('#messages-wrapper');
		$(result).show();
	}
	
	var erroneousInput = Object.create(messageBlock);
	erroneousInput.message = "I'm sorry, I didn't get that.";
	
	var timesWash = Object.create(messageBlock);
	timesWash.message = "How many times do you wash your hair?";
	
	var shampooRecommend = Object.create(messageBlock);
	
	var unhealthyWash = Object.create(messageBlock);
	unhealthyWash.hairQuality = null;
	unhealthyWash.numOfWash = null;
	unhealthyWash.callback = function() {
		var recommendedShampoo = unhealthyWash.hairQuality === 'oily' ? 'oil-control' : 'daily shine';
		shampooRecommend.render('shampoo-recommend', 'I recommend you use Dove\'s '+recommendedShampoo+' shampoo.');
		var result = $('#dove-carousel').wrap("<div class='message-block'></div>")
		$(result).parent().appendTo('#messages-wrapper')
		$(result).show();
	}
	
	var thatsGreat = Object.create(messageBlock);
	thatsGreat.message = "This is great!";
	thatsGreat.callback = function(){
		videoRecommend.render('video-recommend');
	}
	
	$(document).ready(function() {
		prevMessage = introText;
	});
	
	
	//Checking state of the app, and handling user responses accordingly
	
	$('#user-submit').click(function() {
		let userInp = $('#user-input').val();
		let userInpCaps = userInp.toUpperCase();
		var resolvedInp;
		$('#user-input').val(' ');
		userInput.render('user-input', userInp);

		nlpUserInput(userInp).then(function(value) {
			resolvedInp = value.result.fulfillment.speech;
			
  		switch(prevMessage.role) {
				case 'intro': {
					console.log("Value is "+value);
					switch(resolvedInp) {
						case 'oily' : 
							unhealthyWash.hairQuality = 'oily';
							timesWash.render('times-wash');
							prevMessage = timesWash;
							break;
						case 'dull' : 
							unhealthyWash.hairQuality = 'dull';
							timesWash.render('times-wash');
							prevMessage = timesWash;
							break;
						case 'good' : 
							thatsGreat.render('thats-great');
							break;
						default :
							erroneousInput.render('error-input');
							introText.render('intro');
					}
					break;
				}
			
				case 'times-wash': {
					switch(Number.isNaN(Number(resolvedInp))) {
						case true : 
							erroneousInput.render('error-input');
							timesWash.render('times-wash');
							break;
						case false :  
							unhealthyWash.numOfWash = resolvedInp;
							unhealthyWash.render('unhealthy-wash', "Washing your hair "+unhealthyWash.numOfWash+" of times per week when it is "+unhealthyWash.hairQuality+" is not healthy.");
							break;
					}
				}
			}
		});
	});
}());