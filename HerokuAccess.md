# Heroku Access
Team members must use their Boise State emails for access to the **cs471-team1** Heroku team. An email invite was set out from Heroku. It will be the most recent invite, because I had to delete and reinvite members after one team member got a 404 error code. Team members are all set as *admin*.

Members can access the team via this [link.](https://dashboard.heroku.com/teams/cs471-team1/)

The Heroku app is **gentle-shore-50931**.

TagBot has been deployed on Heroku with Node.js and a subdir buildpack via Heroku. The subdir buildpack was required because Heroku's buildpacks look for build information at the root level of the repository, but our package.json file is located in the subdirectory *my-first-app*. I created a wiki page, [Heroku Deployment Setup](https://github.com/BoiseState/CS471-S21-Team1/wiki/Heroku-Deployment-Setup), with detailed information of how the app was set up in Heroku and any errors I experienced.

# Heroku Database
Postgres database was added to the application. It can be found under the Heroku dashboard for our application > Resources. If you click on the database, a new tab will come up with the database information, including Settings for the database. Credential information can be found under the Settings tab, if the credentials ever change.

Credentials:
Host: ec2-54-167-168-52.compute-1.amazonaws.com
Database: d3fdn353g17soe
User: ptwqfwvglwtqst
Port: 5432
Password: de8ec3125d28ff9f35b5c7fe1d4746135f7745284cecbd5040d3c2cd84c0cf7c
URI: postgres://ptwqfwvglwtqst:de8ec3125d28ff9f35b5c7fe1d4746135f7745284cecbd5040d3c2cd84c0cf7c@ec2-54-167-168-52.compute-1.amazonaws.com:5432/d3fdn353g17soe
Heroku CLI: heroku pg:psql postgresql-rigid-07335 --app gentle-shore-50931