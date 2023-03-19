# Community Engagement Rate in GitHub Discussions

> **Note**: This is a proof-of-concept that calculates the community engagement rate (CER) based on a set of given discussions retrieved from the [GitHub GraphQL API](https://docs.github.com/en/graphql/overview/explorer). At the moment, it statically fetches the last `MAX_DISCUSSION` discussions from the API and calculates the community engagement rate for these. There is no way yet to calculate the CER for all Discussions since a given date.

This script calculates the community engagement rate for GitHub Discussions according to two different approaches.

## Option A: Count at most one community member per Discussion

With this approach, the community engagement rate can at most be 1 (or 100%) because we only count in a binary way whether a Discussion had some kind of engagement from a community member or not.

## Option B:  Count all community members in a Discussion

With this approach, the community engagement rate can increase beyond 1 (or 100%) because we potentially count more than one community member engaged per Discussion. Ultimately, this number expresses “how many community members engage Discussion on average per Discussion”.
