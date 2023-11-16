//----------------------------- Navigation Menu --------------

(() => {
   const hamburgerBtn = document.querySelector(".hamburger-btn"),
       navMenu = document.querySelector(".nav-menu"),
       closeNavBtn = navMenu.querySelector(".close-nav-menu");

   hamburgerBtn.addEventListener("click", showNavMenu);
   closeNavBtn.addEventListener("click", hideNavMenu);

   function showNavMenu() {
       navMenu.classList.add("open");
       bodyScrollingToggle();
   }

   function hideNavMenu() {
       navMenu.classList.remove("open");
       fadeOutEffect();
       bodyScrollingToggle();
   }

   function fadeOutEffect() {
       const fadeEffect = document.querySelector(".fade-out-effect");
       fadeEffect.classList.add("active");
       setTimeout(() => fadeEffect.classList.remove("active"), 300);
   }

   document.addEventListener("click", (event) => {
       if (event.target.classList.contains('link-item') && event.target.hash !== "") {
           event.preventDefault();
           const hash = event.target.hash;

           document.querySelector(".section.active").classList.remove("active");
           document.querySelector(hash).classList.add("active");

           if (navMenu.querySelector(".active")) {
               navMenu.querySelector(".active").classList.remove("active", "inner-shadow", "outer-shadow", "hover-in-shadow");
           }

           event.target.classList.add("active", "inner-shadow");

           if (navMenu.classList.contains("open")) {
               hideNavMenu();
           } else {
               fadeOutEffect();
           }

           window.location.hash = hash;
       }
   });

   function updateActiveMenuItem() {
       const sections = document.querySelectorAll(".section");
       const navLinks = document.querySelectorAll(".nav-menu .link-item");

       let index = sections.length;

       while(--index && window.scrollY + 50 < sections[index].offsetTop) {}

       navLinks.forEach((link) => {
           link.classList.remove("active", "inner-shadow");
       });

       navLinks[index].classList.add("active", "inner-shadow");
   }

   window.addEventListener("scroll", () => {
       updateActiveMenuItem();
   });
})();

// ------- About Section Tabs --------
(() => {
   const aboutSection = document.querySelector(".about-section"),
       tabsContainer = document.querySelector(".about-tabs");

   tabsContainer.addEventListener("click", (event) => {
       if (event.target.classList.contains("tab-item") && !event.target.classList.contains("active")) {
           const target = event.target.getAttribute("data-target");

           // Deactivate existing active 'tab-item'
           tabsContainer.querySelector('.active').classList.remove("outer-shadow", "active");

           // Activate new 'tab-item'
           event.target.classList.add("active", "outer-shadow");

           // Deactivate existing active 'tab-content'
           aboutSection.querySelector(".tab-content.active").classList.remove("active");

           // Activate new 'tab-content'
           aboutSection.querySelector(target).classList.add("active");
       }
   });
})();

// Function for toggling body scrolling
function bodyScrollingToggle() {
   document.body.classList.toggle("hidden-scrolling");
}


/*--------------- portfolio filter and popup------------------ */

(() =>{
   const filterContainer = document.querySelector(".portfolio-filter"), 
   portfolioItemsContainer = document.querySelector(".portfolio-items"),
   portfolioItems = document.querySelectorAll(".portfolio-item"),
   popup = document.querySelector(".portfolio-popup"),
   prevBtn = popup.querySelector(".pp-prev"),
   nextBtn = popup.querySelector(".pp-next"),
   closeBtn = popup.querySelector(".pp-close"),
   projectDetailsContainer = popup.querySelector(".pp-details"),
   projectDetailsBtn = popup.querySelector(".pp-project-details-btn");

   let itemIndex, slideIndex, screenshots;

   // filter portfolio items 
   filterContainer.addEventListener("click", (event) =>{
      if(event.target.classList.contains("filter-item") && !event.target.classList.contains("active")){
         // deactivating existing active 'filter-item'
         filterContainer.querySelector(".active").classList.remove("outer-shadow", "active");
         // activate new 'filter item'
         event.target.classList.add("active", "outer-shadow");
         const target = event.target.getAttribute("data-target");
         portfolioItems.forEach((item) =>{
            if(target === item.getAttribute("data-category") || target === "all"){
               item.classList.remove("hide");
               item.classList.add("show");
            }else{
               item.classList.remove("show");
               item.classList.add("hide");
            }
         })
      }
   })

   portfolioItemsContainer.addEventListener("click",(event) =>{
      if(event.target.closest(".portfolio-item-inner")){
         const portfolioItem = event.target.closest(".portfolio-item-inner").parentElement;
         // get the portfolioItem index 
         itemIndex = Array.from(portfolioItem.parentElement.children).indexOf(portfolioItem);
         screenshots = portfolioItems[itemIndex].querySelector(".portfolio-item-img img").getAttribute("data-screenshots");
         //convert screenshots into array
         screenshots = screenshots.split(",");
         if(screenshots.length === 1){
            prevBtn.style.display="none";
            nextBtn.style.display="none";
         }else{
            prevBtn.style.display="block";
            nextBtn.style.display="block";
         }
         slideIndex = 0;
         popupToggle();
         popupSlideshow();
         popupDetails();
      }
   })

   closeBtn.addEventListener("click",() =>{
      popupToggle();
      if(projectDetailsContainer.classList.contains("active")){
      popupDetailsToggle();
      }
   })

   function popupToggle(){
      popup.classList.toggle("open");
      bodyScrollingToggle();
   }
   function popupSlideshow(){
      const imgSrc = screenshots[slideIndex];
      const popupImg = popup.querySelector(".pp-img");
      // activating loader until the popupImg loaded
      popup.querySelector(".pp-loader").classList.add("active");
      popupImg.src = imgSrc;
      popupImg.onload = () =>{
         // deactive loader after the popupimg loaded
         popup.querySelector(".pp-loader").classList.remove("active");
      }
      popup.querySelector(".pp-counter").innerHTML = (slideIndex +1) + " of " + screenshots.length;
   }

   // next slide 
   nextBtn.addEventListener("click",() =>{
      if(slideIndex === screenshots.length-1){
         slideIndex = 0;
      }else{
         slideIndex++;
      }
      popupSlideshow();
   })

   //prev slide
   prevBtn.addEventListener("click",() =>{
      if(slideIndex === 0){
         slideIndex = screenshots.length-1;
      }else{
         slideIndex--;
      }
      popupSlideshow();
   })

   function popupDetails(){
      // if portfolio-item-details not exists 
      if(!portfolioItems[itemIndex].querySelector(".portfolio-item-details")){
         projectDetailsBtn.style.display = "none";
         return; //end function execution
      }
      projectDetailsBtn.style.display = "block";
      // getting the project details 
      const details = portfolioItems[itemIndex].querySelector(".portfolio-item-details").innerHTML;
      // set the project details

      popup.querySelector(".pp-project-details").innerHTML = details;
      // get the project details
      const title = portfolioItems[itemIndex].querySelector(".portfolio-item-title").innerHTML;
      // set the project title 
      popup.querySelector(".pp-title h2").innerHTML = title;
      // get the project category 
      const category = portfolioItems[itemIndex].getAttribute("data-category");
      // set the project category 
      popup.querySelector(".pp-project-category").innerHTML = category.split("-").join(" ");
   }

   projectDetailsBtn.addEventListener("click",()=>{
      popupDetailsToggle();
   })

   function popupDetailsToggle(){
      if(projectDetailsContainer.classList.contains("active")){
         projectDetailsBtn.querySelector("i").classList.remove("fa-minus");
         projectDetailsBtn.querySelector("i").classList.add("fa-plus");
         projectDetailsContainer.classList.remove("active");
         projectDetailsContainer.style.maxHeight = 0 + "px";
      }else{
         projectDetailsBtn.querySelector("i").classList.remove("fa-plus");
         projectDetailsBtn.querySelector("i").classList.add("fa-minus");
         projectDetailsContainer.classList.add("active");
         projectDetailsContainer.style.maxHeight = projectDetailsContainer.scrollHeight + "px";
         popup.scrollTo(0,projectDetailsContainer.offsetTop);
      }
   }

})();


/* ------------------------------------testimonial slider--------------------------------

   (()=>{

      const sliderContainer = document.querySelector(".testi-slider-container"),
      slides = sliderContainer.querySelectorAll(".testi-item"),
      slideWidth = sliderContainer.offsetWidth;
      prevBtn = document.querySelector(".testi-slider-nav .prev"),
      nextBtn = document.querySelector(".testi-slider-nav .next"),
      activeSlide = sliderContainer.querySelector(".testi-item.active");
      let slideIndex = Array.from(activeSlide.parentElement.children).indexOf(activeSlide);

      //setting width of all slides
      slides.forEach((slide) =>{
         slide.style.width = slideWidth + "px";
      })

      //setting width of sliderContainer
      sliderContainer.style.width = slideWidth * slides.length + "px";

      nextBtn.addEventListener("click", () =>{
         if(slideIndex === slides.length -1){
            slideIndex = 0;
         }else{
            slideIndex++;
         }
         slider();
      })

      prevBtn.addEventListener("click", () =>{
         if(slideIndex === 0){
            slideIndex = slides.length -1;
         }else{
            slideIndex--;
         }
         slider();
      })

      function slider(){
         // deactivating existing active slides 
         sliderContainer.querySelector(".testi-item.active").classList.remove("active");
         // activating new slides
         slides[slideIndex].classList.add("active");
         sliderContainer.style.marginLeft = - (slideWidth * slideIndex) + "px";
      }
      slider();

   })(); */

   window.addEventListener("load", () => {
      const preloader = document.querySelector(".preloader");
      preloader.classList.add("fade-out");
      setTimeout(() => preloader.style.display = "none", 600);
  });