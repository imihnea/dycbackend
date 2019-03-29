Deal Your Crypto Project with Bulma CSS Framework on Frontend. To be remade in React later.

Tasks to be done:

Frontend:

    High Priority:

         UI => New product => Feature deal
            => Buy product => Checkout page
         Reviews => Editing reviews from profile => redirect to profile; same for product page
                 => Put products in Iframe if editing/deleting the reviews doesn't refresh/redirect the parent window

    Low Priority:

         Admin page
         Make everything responsive (see comments in css files)
         Make an email template
         Better email wording


Backend:

   High Priority:

      Dashboard => Add balance route
      Security => Validate and sanitize every user input
               => Anti DDOS
      Reviews => Only create product reviews, show them on the profile page
   Low Priority:

      Login => Link accounts facebook, gmail etc to original
      
      Dashboard 
               => Settings
                  => connections
               => 2 Factor when withdrawing                      
      Logs => Log errors
           => Log deal status changes
           => Log user changes
      Search => Delete tag paths
      Product => Delete tags
      Email verification => Error path @confirmEmail doesn't render error
      Categories => Add more in future
      Data => Save product data
      
After Launch:

      Users => Create premium/business user who can access product and search data 
      
      Data => Create another Elastic instance for premium/business user data
           => Make a page where they can query that instance => Data compiled into charts 