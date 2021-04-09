
const { Octokit } = require("@octokit/core");
const fs = require('fs');
const readline = require('readline');
let line_reader;

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

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
    const bugLabel = context.issue({
      labels: ['bug']
    });
    const enhancementLabel = context.issue({
      labels: ['enhancement']
    });
    const defaultLabel = context.issue({
      labels: ['invalid']
    });

//test if body is empty
if(issueBody === ""){
  const returnComment = context.issue({
    body: "Please describe the issue so it can be tagged."
  });
  context.octokit.issues.addLabels(defaultLabel);
  return context.octokit.issues.createComment(returnComment);
}

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
      const ret = await octo.request('GET /repos/{owner}/{repo}/labels', {
        owner: context.payload.installation.account.login,
        repo: repoObject.name
      });

      var repoID = repoObject.id;
      var fileName = 'label_cache/' + repoID;

      fs.writeFile(fileName, '', function(err) {
        if(err) { console.log("Couldn't create label cache"); }
      });

      ret.data.forEach(label => {
        fs.appendFile(fileName, label.name + ',', function(err) {
          if(err) throw err;
        });
      });
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
    
    app.log.info(context);
    const octo = new Octokit();
    
    await new Promise(resolve => {
      setTimeout(resolve, 15000)
    });

    const ret = await octo.request('GET /repos/{owner}/{repo}/labels', {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    });

    var repoID = context.payload.repository.id;
    var fileName = 'label_cache/' + repoID;

    fs.writeFile(fileName, '', function(err) {
      if(err) { console.log("Couldn't create label cache"); }
    });

    ret.data.forEach(label => {
      fs.appendFile(fileName, label.name + ',', function(err) {
        if(err) throw err;
      });
    });

  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};