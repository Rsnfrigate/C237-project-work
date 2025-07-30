This project, titled RP Resource Centre, is a group submission for the C237 Software Application Development CA2 assignment. It is a web-based system that allows Republic Polytechnic students to loan laptops from the Resource Centre. The system includes essential features such as user registration, login, session management, CRUD for loan records, role-based access control (admin vs student), and server-side filtering. The application uses app.js as the main server file and follows a simplified structure similar to the Supermarket App format.

The group members and their respective contributions are as follows: Alicia and Fiona worked on user authentication and role-based authorization, including secure login, logout, registration, and access restrictions. Wen Yi and Qusyari implemented CRUD functionalities for the loan request system. Pin Hao developed the search/filter functionality using Express routes and SQL queries with WHERE clauses, ensuring that filtering was done server-side. Haad was responsible for the UI, using EJS, Bootstrap, and custom CSS to create a clean, professional, and responsive design.

The technologies used in this project include Node.js, Express.js, EJS templating, MySQL for database management, Bootstrap 5 for UI components, and custom CSS for styling. All backend logic is kept in a single file, app.js, to maintain simplicity and ease of understanding. Views are stored in the views folder, and the stylesheet is placed in public/css/style.css.

To set up the application, create a MySQL database named rp_resource_centre, and then create three tables: users, laptops, and loan_requests. The users table stores user credentials and roles. The laptops table tracks device models and availability. The loan_requests table links users and laptops with dates and status. Sample laptop data can be inserted for testing.

After the database is ready, install the required dependencies using npm install express express-session mysql2 bcrypt ejs. Then run the app with node app.js and open your browser to http://localhost:3000.

Users can register as either students or admins. Students are allowed to request laptop loans by selecting available devices and choosing loan/return dates. Admins can view all loan records, delete entries, and filter them by status (pending, approved, or returned). Only logged-in users can access protected pages, and only admins are allowed to delete loan records.

Password security is ensured using bcrypt hashing. The project applies middleware functions to protect routes based on login status and user roles. Filtering functionality is implemented fully on the backend for accuracy and performance.

This submission demonstrates group collaboration and incorporates all required CA2 features using only content and techniques covered in class. The application is lightweight, functional, and ready for deployment or future enhancements.
