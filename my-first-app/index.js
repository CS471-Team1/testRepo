process.env['NODE_TLS_REJECT_UNAUTHORIZED']=0; //This is just to bypass a database SSL error I was getting

const { Octokit } = require("@octokit/core");
const fs = require('fs');
const readline = require('readline');
const { Client } = require('pg');
var client = new Client({
  host: "ec2-54-167-168-52.compute-1.amazonaws.com",
  port: 5432,
  database: "d3fdn353g17soe",
  user: "ptwqfwvglwtqst",
  password: "de8ec3125d28ff9f35b5c7fe1d4746135f7745284cecbd5040d3c2cd84c0cf7c",
  ssl: true
});
createLabelsTable();
let line_reader;

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  //Recognizes conflicting tags
  app.on("issues.opened", async (context) => {
    //console.log(context.payload.issue.labels);

    let tagnames = [];
    let conflict = false;

    for(var i of context.payload.issue.labels) {
      tagnames.push(i.name);
    }

    if(tagnames.includes('bug') && tagnames.includes('feature')) {
      conflict = true;
    }

    if(conflict === true) {
      const returnComment = context.issue({
        body: "There appears to be conflicting labels on this issue. Please review the lables you have applied and confirm that they are correct."
      });
      return context.octokit.issues.createComment(returnComment);
    }
  });

  //tag checking functionality plus tag adding functionality
  app.on("issues.opened", async (context) => {
     //Title of issue string
     var issueTitle = context.payload.issue.title;
     //Body of issue string
     var issueBody = context.payload.issue.body;
     
     
     //Iterate through issue title and body. Counts the amount of times bug, feature, and story are mentioned
     
     let bugKeywordCount = 0;
     let featureKeywordCount = 0;
     let storyKeywordCount = 0;
 
 
     //TITLE COUNTER
     let titleArray = issueTitle.split(" "); 
     var wordsInTitle = titleArray.length;
     for(i = 0; i < wordsInTitle; i++  ){
 
       //create temporary string
       let tempTitle = titleArray[i].toLowerCase();
 
         //bug count
         if(tempTitle === "bug" ){
           bugKeywordCount++;
         }
 
         //feature count
         if(tempTitle === "feature" ){
           featureKeywordCount++;
         }
 
         //story count
         if(tempTitle === "story" ){
           storyKeywordCount++;
         }
 
         
     }
 
     //BODY COUNTER
     let bodyArray = issueBody.split(" "); 
     var wordsInBody = bodyArray.length;
     for(i = 0; i < wordsInBody; i++  ){
 
       //create temporary string
       let tempBody = bodyArray[i].toLowerCase();
 
         //bug count
         if(tempBody === "bug" ){
           bugKeywordCount++;
         }
 
         //feature count
         if(tempBody === "feature" ){
           featureKeywordCount++;
         }
 
         //story count
         if(tempBody === "story" ){
           storyKeywordCount++;
         }
 
         
     }

 //test if body is empty (meaningless commit)
 if(issueBody === ""){
  const returnComment = context.issue({
    body: "Please describe the issue so it can be tagged."
  });
  return context.octokit.issues.createComment(returnComment);
}
    //boolean for whether an issue is tagged or not
    var isTagged;
    
    //sets whether the issue is tagged or not
    if(context.payload.issue.labels === undefined || context.payload.issue.labels.length == 0){
      isTagged = false;
    } else{
      isTagged = true;
    }

    //simple test for tag checking functionality
    if(isTagged){
      console.log('tagged');
    }
    if(!isTagged){
      console.log('not tagged');
    }
    
    //labels you wish to add to an untagged issue
    /**
     * LABELS ARE ONLY FOR DEFAULT GITHUB REPOSITORIES
     */
    const bugLabel = context.issue({
      labels: ['bug']
    });
    const enhancementLabel = context.issue({
      labels: ['enhancement']
    });
    const defaultLabel = context.issue({
      labels: ['invalid']
    });



    //adds the label to the issue if that issue has no labels
    if(!isTagged){
      if(bugKeywordCount>featureKeywordCount){
        return context.octokit.issues.addLabels(bugLabel);
      }
      else if(featureKeywordCount>bugKeywordCount){
        return context.octokit.issues.addLabels(enhancementLabel);
      }
      else{
      return context.octokit.issues.addLabels(defaultLabel);
      }
    }
  });
  
  app.on("installation.created", async (context) => {

    const octo = new Octokit();
    for(const repoObject of context.payload.repositories) {
      var repoID = repoObject.id;
      var reponame = repoObject.name;
      var owner = context.payload.installation.account.login;
      client.query("Select * from labels where RepoID = " + repoID,
      async function(err, result) {
        if(result.rowCount == 0) {
          console.log("No rows returned, getting all labels");
          var allLabels = await getAllLabels(owner, reponame);
          let labelString = "";
          allLabels.data.forEach(label => {
            labelString += label.name + ","
          });
          client.query("Insert into labels (RepoID, RepoName, Owner, Labels) values (" + BigInt(repoID) + ", '" + reponame + "', '" + owner + "', '" + labelString + "');");
        }
        else {
          var allLabels = await getAllLabels(owner, reponame);
          let labelString = "";
          allLabels.data.forEach(label => {
            labelString += label.name + ","
          });
          client.query("update labels set Labels = '" + labelString + "' where RepoID = " + BigInt(repoID) + ";");
        }
      }
    );
    }
  });

  // app.on("issues.opened", async (context) => {
  //   const issueComment = context.issue({
  //     body: "Thanks for opening this issue!!!!",
  //   });
  //   return context.octokit.issues.createComment(issueComment);
  // });

  app.on(["issue_comment.created", "issue_comment.edited"], async (context) => {
    let name = context.payload.sender.login;
    if(!name.includes("bot")) {
      const returnComment = context.issue({
        body: "Thanks for commenting " + name + ". We will look into your comment soon!"
      });
      return context.octokit.issues.createComment(returnComment);
    }
  });

  app.on("issues.edited", async (context) => {
    const issueEdited = context.issue({
      body: "We noticed an edit to the original issue. A tag re-check will occur momentarily"
    });
    return context.octokit.issues.createComment(issueEdited);
  });

  app.on(['label.created', 'label.deleted', 'label.edited'], async (context) => {
    
    var repoID = context.payload.repository.id;
    var reponame = context.payload.repository.name;
    var owner = context.payload.repository.owner.login;

    client.query("Select * from labels where RepoID = " + repoID,
      async function(err, result) {
        if(result.rowCount == 0) {
          console.log("No rows returned, getting all labels");
          var allLabels = await getAllLabels(owner, reponame);
          let labelString = "";
          allLabels.data.forEach(label => {
            labelString += label.name + ","
          });
          client.query("Insert into labels (RepoID, RepoName, Owner, Labels) values (" + BigInt(repoID) + ", '" + reponame + "', '" + owner + "', '" + labelString + "');");
        }
        else {
          if(context.payload.action == 'edited' && !(typeof(context.payload.changes.name) === "undefined")) {
            var labels = result.rows[0].labels.split(',');
            var newLabelString = "";
            for(i = 0; i < labels.length-1; i++) {
              if(labels[i] == context.payload.changes.name.from) {
                labels[i] = context.payload.label.name;
              }
              newLabelString += labels[i] + ',';
            }
            client.query("update labels set Labels = '" + newLabelString + "' where RepoID = " + BigInt(repoID) + ";")
          }
          else if(context.payload.action == 'deleted') {
            var labels = result.rows[0].labels.split(',');
            var newLabelString = "";
            for(i = 0; i < labels.length-1; i++) {
              if(labels[i] != context.payload.label.name) {
                newLabelString += labels[i] + ',';
              }
            }
            client.query("update labels set Labels = '" + newLabelString + "' where RepoID = " + BigInt(repoID) + ";")
          }
          else if(context.payload.action == 'created') {
            var labels = result.rows[0].labels;
            labels += context.payload.label.name + ',';
            client.query("update labels set Labels = '" + labels + "' where RepoID = " + BigInt(repoID) + ";")
          }
        }
      }
    );
  });
}

//Creates the labels table if for some reason it's not around.
async function createLabelsTable() {
  await client.connect();
  client.query("CREATE TABLE IF NOT EXISTS labels (RepoID bigint not null primary key, RepoName varchar(50) not null, Owner varchar(50) not null, Labels varchar(200))",
                function(err, result) {
                  if(err) { console.log("Could not create table"); };
                }
  );
}

async function getAllLabels(Owner, Repo) {
  const octo = new Octokit();
  return await octo.request('GET /repos/{owner}/{repo}/labels', {
                  owner: Owner,
                  repo: Repo
               });
}
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
