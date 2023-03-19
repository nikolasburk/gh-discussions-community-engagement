import { gql, GraphQLClient } from "graphql-request";

const ROOT_ENDPOINT = "https://api.github.com/graphql";
const AUTH_TOKEN = "";

const TEAM_MEMBERS = ["ludralph", "nurul3101"];

const MAX_DISCUSSION = 49;
const MAX_COMMENTS = 100;
const MAX_REPLIES = 100;

const query = gql`
{
  repository(name: "prisma", owner: "prisma") {
    id
    nameWithOwner
    discussions(first: ${MAX_DISCUSSION}, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        url
        title
        createdAt
        author {
          login
        }
        comments(first: ${MAX_COMMENTS}) {
          nodes {
            createdAt
            author {
              login
            }
            replies(first: ${MAX_REPLIES}) {
              totalCount
              nodes {
                createdAt
                author {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
}
`;
const client = new GraphQLClient(ROOT_ENDPOINT, {
  headers: {
    Authorization: `bearer ${AUTH_TOKEN}`,
  },
});

type Discussion = {
  url: string;
  title: string;
  createdAt: string;
  author: Author;
  comments: any;
  numberOfEngagedCommunityMembers: number;
};

type Author = {
  login: string;
};

// A comment is a top-level response in a GitHub Discussion
type Comment = {
  createdAt: string;
  author: Author;
  replies: any;
};

// A reply is a response to a comment (essentialy a _thread_)
type Reply = {
  createdAt: string;
  author: Author;
};

function parseResponseIntoDiscussions(data: any): Discussion[] {
  const repo = data["repository"];
  const discussion = repo["discussions"];
  const discussionNodes: Discussion[] = discussion["nodes"];
  return discussionNodes;
}

function retrieveCommentsFromDiscussion(discussion: Discussion): Comment[] {
  const comments = discussion["comments"];
  const commentNodes: Comment[] = comments["nodes"];
  return commentNodes;
}

function retrieveRepliesFromComment(comment: Comment): Reply[] {
  const replies = comment["replies"];
  const replyNodes: Reply[] = replies["nodes"];
  return replyNodes;
}

function retrieveCommunityMembersEngagedInComment(comment: Comment, discussionAuthor: Author): string[] {
  const communityMembers: string[] = [];

  // If the author of the _comment_ is a community member, add them to the output
  const commentAuthorLogin = comment.author.login;
  if (
    !TEAM_MEMBERS.includes(commentAuthorLogin) && // not a team member
    !communityMembers.includes(commentAuthorLogin) && // prevent duplicate
    commentAuthorLogin !== discussionAuthor.login // not OP
  ) {
    communityMembers.push(commentAuthorLogin);
  }

  // If the author of a _reply_ is a community member, add them to the output
  const replies = retrieveRepliesFromComment(comment);
  for (const reply of replies) {
    const replyAuthorLogin = reply.author.login;
    if (
      !TEAM_MEMBERS.includes(replyAuthorLogin) && // not a team member
      !communityMembers.includes(replyAuthorLogin) && // prevent duplicate
      replyAuthorLogin !== discussionAuthor.login // not OP
    ) {
      communityMembers.push(replyAuthorLogin);
    }
  }

  return communityMembers;
}

function setNumberOfEngagedCommunityMembersPerDiscussion(discussions: Discussion[]): Discussion[] {
  // For each Discussion, find all community members engaged in that Discussion
  for (const discussion of discussions) {
    let allCommunityMembersInDiscussions: string[] = [];
    const comments = retrieveCommentsFromDiscussion(discussion);

    for (const comment of comments) {
      const communityMembersInComment = retrieveCommunityMembersEngagedInComment(comment, discussion.author);

      const allCommunityMembersInDiscussionsWithDuplicates = [
        ...allCommunityMembersInDiscussions,
        ...communityMembersInComment,
      ];
      allCommunityMembersInDiscussions = removeDuplicatesFromStringArray(
        allCommunityMembersInDiscussionsWithDuplicates
      );
    }

    discussion.numberOfEngagedCommunityMembers = allCommunityMembersInDiscussions.length;
  }

  return discussions;
}

async function calculateOptionAEngagementRate() {
  const data: any = await client.request(query);
  const discussionData = parseResponseIntoDiscussions(data);
  const discussions = setNumberOfEngagedCommunityMembersPerDiscussion(discussionData);

  const allEngagementCounts = discussions
  .map((discussion) => {
    return discussion.numberOfEngagedCommunityMembers;
  })
  .reduce((prev, current) => prev + (current > 0 ? 1 : 0));
  
  const totalDiscussionCount = discussions.length;
  console.log(`Total Discussions: ${totalDiscussionCount}`);
  console.log(`Total Community Engagement (A): ${allEngagementCounts}`);

  const communityEngagementRate = allEngagementCounts / totalDiscussionCount;
  console.log(`The Option A community engagement rate is: ${communityEngagementRate}`);
}

async function calculateOptionBEngagementRate() {
  const data: any = await client.request(query);
  const discussionData = parseResponseIntoDiscussions(data);
  const discussions = setNumberOfEngagedCommunityMembersPerDiscussion(discussionData);

  const allEngagementCounts = discussions
    .map((discussion) => {
      return discussion.numberOfEngagedCommunityMembers;
    })
    .reduce((prev, current) => prev + current);


  const totalDiscussionCount = discussions.length;
  console.log(`Total Discussions: ${totalDiscussionCount}`);
  console.log(`Total Community Engagement (B): ${allEngagementCounts}`);

  const communityEngagementRate = allEngagementCounts / totalDiscussionCount;
  console.log(`The Option B community engagement rate is: ${communityEngagementRate}`);
}

function removeDuplicatesFromStringArray(array: Array<string>): Array<string> {
  const arrayWithoutDuplicates = array.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  return arrayWithoutDuplicates;
}

async function main() {
  await calculateOptionAEngagementRate();
  await calculateOptionBEngagementRate();
}

main();
