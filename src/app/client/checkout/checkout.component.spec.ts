import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { CheckoutComponent } from './checkout.component';
import { CartService } from '../../shared/services/cart.service';
import { WavePaymentService } from '../../shared/services/wave-payment.service';

describe('CheckoutComponent - Wave Integration', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockWaveService: jasmine.SpyObj<WavePaymentService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const cartSpy = jasmine.createSpyObj('CartService', ['getCart', 'clearCart']);
    const waveSpy = jasmine.createSpyObj('WavePaymentService', ['initiatePayment']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent, HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        { provide: CartService, useValue: cartSpy },
        { provide: WavePaymentService, useValue: waveSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    mockCartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    mockWaveService = TestBed.inject(WavePaymentService) as jasmine.SpyObj<WavePaymentService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;

    // Mock cart service
    mockCartService.getCart.and.returnValue(of({
      itemCount: 2,
      subtotal: 50,
      tax: 10,
      total: 60,
      items: [
        { photoId: '1', eventId: '1', eventName: 'Test Event', price: 25, quantity: 2 }
      ],
      totalItems: 2,
      totalPrice: 50,
      uniqueEvents: 1
    }));
  });

  it('should create component with Wave payment method', () => {
    expect(component).toBeTruthy();
    
    fixture.detectChanges();
    
    // Vérifier que Wave est dans les méthodes de paiement
    const waveMethod = component.paymentMethods.find(method => method.id === 'wave');
    expect(waveMethod).toBeDefined();
    expect(waveMethod?.name).toBe('Wave');
    expect(waveMethod?.icon).toBe('📱');
  });

  it('should process Wave payment successfully', async () => {
    // Setup
    const mockWaveResponse = {
      success: true,
      paymentId: 'WAVE_123456',
      paymentUrl: 'https://checkout.wave.com/pay/123456',
      qrCode: 'data:image/png;base64,mock-qr-code',
      amount: 60,
      currency: 'XOF',
      message: 'Paiement Wave initié avec succès'
    };

    mockWaveService.initiatePayment.and.returnValue(of(mockWaveResponse));

    // Préparer le formulaire
    component.checkoutForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+221123456789',
      address: '123 Test Street',
      city: 'Dakar',
      postalCode: '12345',
      country: 'Senegal',
      acceptTerms: true
    });

    component.selectedPaymentMethod = 'wave';
    fixture.detectChanges();

    // Exécuter le test
    await component.processPayment();

    // Vérifications
    expect(mockWaveService.initiatePayment).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/order-confirmation'], 
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          orderId: jasmine.any(String)
        })
      })
    );
  });

  it('should handle Wave payment failure', async () => {
    // Setup pour échec
    mockWaveService.initiatePayment.and.returnValue(
      of({ success: false, paymentId: '', amount: 0, currency: 'XOF' })
    );

    component.checkoutForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+221123456789',
      address: '123 Test Street',
      city: 'Dakar',
      postalCode: '12345',
      country: 'Senegal',
      acceptTerms: true
    });

    component.selectedPaymentMethod = 'wave';
    
    // Spy sur console.error et alert
    spyOn(console, 'error');
    spyOn(window, 'alert');

    // Exécuter le test
    try {
      await component.processPayment();
    } catch (error) {
      // Vérifier que l'erreur est gérée
      expect(console.error).toHaveBeenCalled();
    }
  });

  it('should display Wave in payment methods list', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const paymentMethodElements = compiled.querySelectorAll('[data-testid="payment-method"]');
    
    // Devrait avoir 3 méthodes: Stripe, PayPal, Wave
    expect(paymentMethodElements.length).toBeGreaterThanOrEqual(3);
    
    const waveElement = Array.from(paymentMethodElements)
      .find(el => el.textContent?.includes('Wave'));
    
    expect(waveElement).toBeTruthy();
  });
});
