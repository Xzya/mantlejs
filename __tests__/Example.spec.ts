import { Model, KeyPaths, ValueTransformer } from "../lib";

describe("Example model using GitHub issues", () => {
    enum GHIssueState {
        Open = 0,
        Closed,
    }

    class GHUser extends Model {
        public readonly username: string;
        public readonly url: string;
        public readonly htmlUrl: string;

        public static JSONKeyPaths(): KeyPaths<GHUser> {
            return {
                username: "login",
                url: "url",
                htmlUrl: "html_url",
            };
        }
    }

    class GHIssue extends Model {
        public readonly url: string;
        public readonly htmlUrl: string;
        public readonly number: number;
        public readonly state: GHIssueState;
        public readonly reporterLogin: string;
        public readonly assignee: GHUser;
        public readonly assignees: GHUser[];
        public readonly updatedAt: Date;

        public title: string;
        public body: string;

        public retrievedAt: Date;

        constructor() {
            super();

            this.retrievedAt = new Date();
        }

        public static JSONKeyPaths(): KeyPaths<GHIssue> {
            return {
                url: "url",
                htmlUrl: "html_url",
                number: "number",
                state: "state",
                reporterLogin: "user.login",
                assignee: "assignee",
                assignees: "assignees",
                updatedAt: "updated_at",
                title: "title",
                body: "body",
            };
        }

        public static updatedAtJSONTransformer(): ValueTransformer {
            return ValueTransformer.forwardAndReversible(
                (value: string) => {
                    return new Date(value);
                },
                (value: Date) => {
                    return value.toISOString();
                },
            );
        }

        public static stateJSONTransformer(): ValueTransformer {
            return ValueTransformer.valueMappingTransformer({
                "open": GHIssueState.Open,
                "closed": GHIssueState.Closed,
            });
        }

        public static assigneeJSONTransformer(): ValueTransformer {
            return ValueTransformer.objectTransformer(GHUser);
        }

        public static assigneesJSONTransformer(): ValueTransformer {
            return ValueTransformer.arrayTransformer(GHUser);
        }
    }

    it("Should work", () => {
        const values = {
            "url": "https://api.github.com/repos/octocat/Hello-World/issues/1347",
            "html_url": "https://github.com/octocat/Hello-World/issues/1347",
            "number": 1347,
            "state": "open",
            "title": "Found a bug",
            "body": "I'm having a problem with this.",
            "user": {
                "login": "octocat",
            },
            "assignee": {
                "login": "octocat",
                "url": "https://api.github.com/users/octocat",
                "html_url": "https://github.com/octocat",
            },
            "assignees": [
                {
                    "login": "octocat",
                    "url": "https://api.github.com/users/octocat",
                    "html_url": "https://github.com/octocat",
                },
            ],
            "updated_at": "2011-04-22T13:33:48.000Z",
        };

        let model: GHIssue;
        let error: Error;

        try {
            model = GHIssue.from(values);
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(model).toBeDefined();

        expect(model.url).toEqual("https://api.github.com/repos/octocat/Hello-World/issues/1347");
        expect(model.htmlUrl).toEqual("https://github.com/octocat/Hello-World/issues/1347");
        expect(model.number).toEqual(1347);
        expect(model.state).toEqual(GHIssueState.Open);
        expect(model.reporterLogin).toEqual("octocat");
        expect(model.assignee).toBeDefined();
        expect(model.assignee.username).toEqual("octocat");
        expect(model.assignee.url).toEqual("https://api.github.com/users/octocat");
        expect(model.assignee.htmlUrl).toEqual("https://github.com/octocat");
        expect(model.assignees).toBeDefined();
        expect(model.assignees.length).toEqual(1);
        expect(model.assignees[0].username).toEqual("octocat");
        expect(model.assignees[0].url).toEqual("https://api.github.com/users/octocat");
        expect(model.assignees[0].htmlUrl).toEqual("https://github.com/octocat");
        expect(model.updatedAt).toEqual(new Date("2011-04-22T13:33:48.000Z"));
        expect(model.title).toEqual("Found a bug");
        expect(model.body).toEqual("I'm having a problem with this.");
        expect(model.retrievedAt).toBeDefined();
        expect(model.retrievedAt).not.toBeNull();

        expect(model.toJSON()).toEqual(values);
    });
});
