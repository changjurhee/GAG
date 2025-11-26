#include "BangGuChaPawn.h"
#include "Camera/CameraComponent.h"
#include "Components/BoxComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "Kismet/GameplayStatics.h"

ABangGuChaPawn::ABangGuChaPawn() {
  PrimaryActorTick.bCanEverTick = true;

  // Setup Components
  CollisionComp = CreateDefaultSubobject<UBoxComponent>(TEXT("CollisionComp"));
  RootComponent = CollisionComp;
  CollisionComp->SetBoxExtent(FVector(40.f, 40.f, 40.f));
  CollisionComp->SetCollisionProfileName(TEXT("Pawn"));

  MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComp"));
  MeshComp->SetupAttachment(RootComponent);

  SpringArmComp =
      CreateDefaultSubobject<USpringArmComponent>(TEXT("SpringArmComp"));
  SpringArmComp->SetupAttachment(RootComponent);
  SpringArmComp->SetRelativeRotation(
      FRotator(-90.f, 0.f, 0.f)); // Top-down view
  SpringArmComp->TargetArmLength = 800.f;
  SpringArmComp->bDoCollisionTest = false;

  CameraComp = CreateDefaultSubobject<UCameraComponent>(TEXT("CameraComp"));
  CameraComp->SetupAttachment(SpringArmComp);

  // Default Values
  MoveSpeed = 300.f;
  GridSize = 100.f; // Assuming 100 units per tile
  MaxFuel = 100.f;
  CurrentFuel = MaxFuel;
  FuelConsumptionRate = 5.f; // Per second

  CurrentDirection = FVector::ZeroVector;
  NextDirection = FVector::ZeroVector;
}

void ABangGuChaPawn::BeginPlay() {
  Super::BeginPlay();
  TargetLocation = GetActorLocation();
}

void ABangGuChaPawn::Tick(float DeltaTime) {
  Super::Tick(DeltaTime);

  UpdateMovement(DeltaTime);

  // Consume Fuel
  if (!CurrentDirection.IsZero()) {
    CurrentFuel -= FuelConsumptionRate * DeltaTime;
    if (CurrentFuel <= 0) {
      CurrentFuel = 0;
      // Handle out of fuel logic if needed
    }
  }
}

void ABangGuChaPawn::SetupPlayerInputComponent(
    UInputComponent *PlayerInputComponent) {
  Super::SetupPlayerInputComponent(PlayerInputComponent);

  PlayerInputComponent->BindAction("Fart", IE_Pressed, this,
                                   &ABangGuChaPawn::UseFart);

  // Bind Axis mapping if using Axis, or Action for grid direction
  // For simplicity, let's assume Action mappings for Up, Down, Left, Right
  PlayerInputComponent->BindAction("MoveUp", IE_Pressed, this,
                                   &ABangGuChaPawn::MoveUp);
  PlayerInputComponent->BindAction("MoveDown", IE_Pressed, this,
                                   &ABangGuChaPawn::MoveDown);
  PlayerInputComponent->BindAction("MoveLeft", IE_Pressed, this,
                                   &ABangGuChaPawn::MoveLeft);
  PlayerInputComponent->BindAction("MoveRight", IE_Pressed, this,
                                   &ABangGuChaPawn::MoveRight);
}

void ABangGuChaPawn::MoveUp() { NextDirection = FVector(1, 0, 0); }
void ABangGuChaPawn::MoveDown() { NextDirection = FVector(-1, 0, 0); }
void ABangGuChaPawn::MoveLeft() { NextDirection = FVector(0, -1, 0); }
void ABangGuChaPawn::MoveRight() { NextDirection = FVector(0, 1, 0); }

void ABangGuChaPawn::UpdateMovement(float DeltaTime) {
  FVector CurrentLoc = GetActorLocation();

  // If we are close to the target location, snap and pick new target
  if (FVector::DistSquared(CurrentLoc, TargetLocation) < 10.f) {
    SetActorLocation(TargetLocation);

    // Try to change direction if queued
    if (!NextDirection.IsZero() &&
        CanMoveTo(TargetLocation + NextDirection * GridSize)) {
      CurrentDirection = NextDirection;
    }

    // Continue moving in current direction if possible
    if (!CurrentDirection.IsZero()) {
      FVector NewTarget = TargetLocation + CurrentDirection * GridSize;
      if (CanMoveTo(NewTarget)) {
        TargetLocation = NewTarget;
        // Rotate mesh to face direction
        MeshComp->SetWorldRotation(CurrentDirection.Rotation());
      } else {
        // Stop if hit wall
        CurrentDirection = FVector::ZeroVector;
      }
    }
  } else {
    // Interpolate to target
    FVector NewLoc = FMath::VInterpConstantTo(CurrentLoc, TargetLocation,
                                              DeltaTime, MoveSpeed);
    SetActorLocation(NewLoc);
  }
}

bool ABangGuChaPawn::CanMoveTo(FVector NewLocation) {
  FHitResult Hit;
  FCollisionQueryParams Params;
  Params.AddIgnoredActor(this);

  // Simple line trace or box sweep to check for walls
  bool bHit = GetWorld()->SweepSingleByChannel(
      Hit, GetActorLocation(), NewLocation, FQuat::Identity, ECC_WorldStatic,
      FCollisionShape::MakeBox(FVector(40.f)), Params);

  return !bHit;
}

void ABangGuChaPawn::UseFart() {
  if (CurrentFuel >= 10.f && SmokeClass) {
    CurrentFuel -= 10.f;
    GetWorld()->SpawnActor<AActor>(SmokeClass, GetActorLocation(),
                                   FRotator::ZeroRotator);
  }
}
