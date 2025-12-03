from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import CartItem, Enrollment, Payment
from .serializers import CartItemSerializer
from courses.models import Course


class CartListAPIView(APIView):
    """List current user's cart items."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """GET /api/cart/ - List cart items."""
        items = CartItem.objects.filter(user=request.user).select_related("course")
        serializer = CartItemSerializer(items, many=True)
        
        subtotal = sum([item.price_at_add for item in items])
        return Response({
            "items": serializer.data,
            "subtotal": float(subtotal),
            "count": len(serializer.data),
        })


class CartAddAPIView(APIView):
    """Add a course to cart."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """POST /api/cart/add/ - Add course to cart."""
        user = request.user
        
        # Check if user is a student
        if user.role != 'student':
            return Response(
                {"detail": "Only students can add courses to cart."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        course_id = request.data.get("course_id")
        if not course_id:
            return Response(
                {"detail": "course_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course = get_object_or_404(Course, id=course_id, is_published=True)
        
        # Cannot add own course
        if course.teacher_id == user.id:
            return Response(
                {"detail": "You cannot add your own course to cart."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already has paid enrollment
        if Enrollment.objects.filter(student=user, course=course, enrollment_type="paid").exists():
            return Response(
                {"detail": "You already own this course."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart_item, created = CartItem.objects.get_or_create(
            user=user,
            course=course,
            defaults={"price_at_add": course.price or 0},
        )
        
        if not created:
            return Response(
                {"message": "Already in cart", "already_in_cart": True},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {"message": "Added to cart", "already_in_cart": False},
            status=status.HTTP_201_CREATED
        )


class CartItemDeleteAPIView(APIView):
    """Remove an item from cart."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, item_id):
        """DELETE /api/cart/items/<int:item_id>/ - Remove item from cart."""
        item = get_object_or_404(CartItem, id=item_id, user=request.user)
        item.delete()
        return Response(
            {"message": "Item removed from cart"},
            status=status.HTTP_204_NO_CONTENT
        )


class CartCheckoutAPIView(APIView):
    """Checkout all items in cart."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """POST /api/cart/checkout/ - Checkout cart items (all or selected)."""
        user = request.user
        
        # Check if user is a student
        if user.role != 'student':
            return Response(
                {"detail": "Only students can checkout."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get selected item IDs from request (optional)
        item_ids = request.data.get("item_ids", [])
        
        # Filter items - if item_ids provided, only checkout those; otherwise checkout all
        if item_ids:
            items = CartItem.objects.filter(user=user, id__in=item_ids).select_related("course")
        else:
            items = CartItem.objects.filter(user=user).select_related("course")
        
        if not items.exists():
            return Response(
                {"detail": "No items to checkout."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created = []
        skipped = []
        
        for item in items:
            course = item.course
            
            # Check if already has paid enrollment
            if Enrollment.objects.filter(student=user, course=course, enrollment_type="paid").exists():
                skipped.append(course.id)
                continue
            
            # Create paid enrollment
            enrollment = Enrollment.objects.create(
                student=user,
                course=course,
                enrollment_type="paid",
                price_paid=item.price_at_add,
            )
            # Create payment record
            Payment.objects.create(
                user=user,
                course=course,
                enrollment=enrollment,
                amount=enrollment.price_paid,
                currency="USD",
                status="succeeded",
                source="cart",
            )
            created.append(course.id)
        
        # Delete only the checked out items from cart
        items.delete()
        
        return Response({
            "message": "Checkout completed.",
            "enrolled_courses": created,
            "already_owned_courses": skipped,
        }, status=status.HTTP_200_OK)

