 // FOR SIDEBAR-MANU-TOP

 <div class="logIn-signUp">
 <div> <%= singButton%></div>
 
 <div class="user-name">
 <span>Привіт, </span>
 <span> <%=  log %> </span>
 </div>
 </div>


// ***********************

// FOR SERVER


if(user){
	res.render('index', {
		log : user.login
		singButton : '<a href="/logout" class="cst-btn" type="submit">Вихід</a>'
		
	} 

	
});

	if(!user) {
		res.render('index', {
			log : 'Привіт!',
			singButton : '<a href="/login" class="cst-btn" type="submit">Вхід</a>'
		});

	}