from django.urls import path
from .views import (
    MyEnrollmentsListAPIView, 
    CompleteLessonAPIView, 
    StudentMyCoursesAPIView,
    MyCertificatesListAPIView,
    PaymentHistoryListAPIView
)
from .cart_views import (
    CartListAPIView,
    CartAddAPIView,
    CartItemDeleteAPIView,
    CartCheckoutAPIView,
)

urlpatterns = [
    path('me/', MyEnrollmentsListAPIView.as_view(), name='my-enrollments'),
    path('me/certificates/', MyCertificatesListAPIView.as_view(), name='my-certificates'),
    path('me/payments/', PaymentHistoryListAPIView.as_view(), name='payment-history'),
    # Cart endpoints
    path('cart/', CartListAPIView.as_view(), name='cart-list'),
    path('cart/add/', CartAddAPIView.as_view(), name='cart-add'),
    path('cart/items/<int:item_id>/', CartItemDeleteAPIView.as_view(), name='cart-item-delete'),
    path('cart/checkout/', CartCheckoutAPIView.as_view(), name='cart-checkout'),
]
