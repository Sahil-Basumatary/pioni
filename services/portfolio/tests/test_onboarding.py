from __future__ import annotations
import uuid
from common import User as UserORM
from common import UserOnboarding as UserOnboardingORM
from portfolio.onboarding import apply_onboarding_patch, get_or_create_onboarding
from portfolio.provisioning import Identity

IDENTITY = Identity(clerk_id="user_abc", email="trader@pioni.ai", username="trader")


class _Result:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class _FakeSession:
    def __init__(self, results):
        self._results = list(results)
        self.added: list = []
        self.refreshed: list = []

    async def execute(self, stmt):
        return _Result(self._results.pop(0))

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid.uuid4()

    async def refresh(self, obj):
        self.refreshed.append(obj)

    async def rollback(self):
        pass


async def test_creates_onboarding_for_new_user():
    session = _FakeSession(results=[None, None])
    row = await get_or_create_onboarding(session, IDENTITY)
    users = [o for o in session.added if isinstance(o, UserORM)]
    rows = [o for o in session.added if isinstance(o, UserOnboardingORM)]
    assert len(users) == 1
    assert len(rows) == 1
    assert row.user_id == users[0].id
    assert row.welcome_seen is False
    assert row.tour_completed is False
    assert row in session.refreshed


async def test_returns_existing_onboarding():
    user = UserORM(clerk_id="user_abc", email="trader@pioni.ai", username="trader")
    user.id = uuid.uuid4()
    existing = UserOnboardingORM(user_id=user.id, welcome_seen=True)
    existing.id = uuid.uuid4()
    session = _FakeSession(results=[user, existing])
    row = await get_or_create_onboarding(session, IDENTITY)
    assert row is existing
    assert session.added == []


def test_tour_completed_sets_timestamps_and_checklist():
    row = UserOnboardingORM(user_id=uuid.uuid4())
    apply_onboarding_patch(row, {"tour_completed": True})
    assert row.tour_completed is True
    assert row.welcome_seen is True
    assert row.checklist_tour is True
    assert row.tour_completed_at is not None


def test_checklist_completed_at_when_all_steps_done():
    row = UserOnboardingORM(user_id=uuid.uuid4())
    apply_onboarding_patch(
        row,
        {
            "checklist_tour": True,
            "checklist_first_trade": True,
            "checklist_view_position": True,
            "checklist_sentiment": True,
            "checklist_limit_order": True,
        },
    )
    assert row.checklist_completed_at is not None
