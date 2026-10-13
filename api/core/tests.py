from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Character, Project


class ProjectApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("writer", password="pw")
        self.other = User.objects.create_user("other", password="pw")
        self.client.force_authenticate(self.user)

    def test_create_without_story_starts_an_empty_one(self):
        response = self.client.post("/api/projects/", {"name": "Heist"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Heist")
        self.assertEqual(response.data["json"]["name"], "Heist")
        self.assertEqual(len(response.data["json"]["graphs"]), 1)

    def test_saving_the_story_renames_the_project(self):
        project = Project.objects.create(user=self.user, json={"name": "Old", "graphs": []})
        story = {"name": "New", "graphs": [{"id": "D1"}, {"id": "D2"}]}
        response = self.client.put(f"/api/projects/{project.id}/", {"json": story}, format="json")
        self.assertEqual(response.status_code, 200)
        listed = self.client.get("/api/projects/").data
        self.assertEqual([(p["name"], p["dialogues"]) for p in listed], [("New", 2)])
        self.assertNotIn("json", listed[0])

    def test_projects_of_other_users_are_hidden(self):
        project = Project.objects.create(user=self.other, json={"name": "Secret"})
        self.assertEqual(self.client.get("/api/projects/").data, [])
        self.assertEqual(self.client.get(f"/api/projects/{project.id}/").status_code, 404)
        self.assertEqual(self.client.get(f"/api/projects/{project.id}/characters/").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/projects/{project.id}/").status_code, 404)

    def test_characters_are_scoped_to_their_project(self):
        a = Project.objects.create(user=self.user, json={"name": "A"})
        b = Project.objects.create(user=self.user, json={"name": "B"})
        hero = {"_id": "hero", "name": "Hero", "meta": None}
        self.assertEqual(self.client.post(f"/api/projects/{a.id}/characters/", hero, format="json").status_code, 201)
        # The same client id in another project is a separate character; posting again updates it.
        self.assertEqual(self.client.post(f"/api/projects/{b.id}/characters/", hero, format="json").status_code, 201)
        renamed = {**hero, "name": "Heroine"}
        self.assertEqual(self.client.post(f"/api/projects/{a.id}/characters/", renamed, format="json").status_code, 200)

        self.assertEqual([c["name"] for c in self.client.get(f"/api/projects/{a.id}/characters/").data], ["Heroine"])
        self.assertEqual([c["name"] for c in self.client.get(f"/api/projects/{b.id}/characters/").data], ["Hero"])
        self.assertEqual(self.client.get("/api/projects/").data[0]["characters"], 1)

        self.assertEqual(self.client.delete(f"/api/projects/{a.id}/characters/hero/").status_code, 204)
        self.assertEqual(Character.objects.filter(project=b).count(), 1)

        self.client.delete(f"/api/projects/{b.id}/")
        self.assertEqual(Character.objects.count(), 0)
