from django.urls import path
from .views import *

urlpatterns = [
    path('', helloWorldView.as_view(), name='hello'),
    path('respond/', augmentedRespond.as_view(), name='respond'),
    path('upload/', miniRag.as_view(), name='miniRag'),
    path('querry/', query.as_view(), name='querry'),
    path('moded_query/', modedQuery.as_view(), name='moded_query'),
    path('notes/', makeNotes.as_view(), name='Revision notes'),
    path('cards/', makeFlashCards.as_view(), name='Flash Cards'),
    path('quiz/', makeQuizCards.as_view(), name='Quiz Cards'),
    path('graph/', grapher.as_view(), name='Make Full Graph'),
    path('add_node/', addNode.as_view(), name='Add Node'),
]