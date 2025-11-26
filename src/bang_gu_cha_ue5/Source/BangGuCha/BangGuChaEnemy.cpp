#include "BangGuChaEnemy.h"
#include "BangGuChaGameModeBase.h"
#include "BangGuChaPawn.h"
#include "Components/BoxComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Kismet/GameplayStatics.h"

ABangGuChaEnemy::ABangGuChaEnemy() {
  PrimaryActorTick.bCanEverTick = true;

  CollisionComp = CreateDefaultSubobject<UBoxComponent>(TEXT("CollisionComp"));
  RootComponent = CollisionComp;
  CollisionComp->SetBoxExtent(FVector(40.f, 40.f, 40.f));
  CollisionComp->SetCollisionProfileName(TEXT("Pawn"));

  MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComp"));
  MeshComp->SetupAttachment(RootComponent);

  MoveSpeed = 200.f; // Slower than player
  GridSize = 100.f;
  StunDuration = 3.0f;
  bIsStunned = false;
  StunTimer = 0.f;

  CurrentDirection = FVector(1, 0, 0); // Start moving somewhere
}

void ABangGuChaEnemy::BeginPlay() {
  Super::BeginPlay();
  TargetLocation = GetActorLocation();
}

void ABangGuChaEnemy::Tick(float DeltaTime) {
  Super::Tick(DeltaTime);

  if (bIsStunned) {
    StunTimer -= DeltaTime;
    if (StunTimer <= 0) {
      bIsStunned = false;
      // Resume movement logic if needed
    }
    return;
  }

  UpdateMovement(DeltaTime);
}

void ABangGuChaEnemy::UpdateMovement(float DeltaTime) {
  FVector CurrentLoc = GetActorLocation();

  if (FVector::DistSquared(CurrentLoc, TargetLocation) < 10.f) {
    SetActorLocation(TargetLocation);
    ChooseNewDirection();

    if (!CurrentDirection.IsZero()) {
      TargetLocation = TargetLocation + CurrentDirection * GridSize;
      MeshComp->SetWorldRotation(CurrentDirection.Rotation());
    }
  } else {
    FVector NewLoc = FMath::VInterpConstantTo(CurrentLoc, TargetLocation,
                                              DeltaTime, MoveSpeed);
    SetActorLocation(NewLoc);
  }
}

void ABangGuChaEnemy::ChooseNewDirection() {
  // Simple AI: Try to move towards player, but stick to grid
  APawn *PlayerPawn = UGameplayStatics::GetPlayerPawn(this, 0);
  if (!PlayerPawn)
    return;

  FVector PlayerLoc = PlayerPawn->GetActorLocation();
  FVector MyLoc = GetActorLocation();
  FVector Diff = PlayerLoc - MyLoc;

  // Prefer axis with larger difference
  FVector PreferredDir = (FMath::Abs(Diff.X) > FMath::Abs(Diff.Y))
                             ? FVector(FMath::Sign(Diff.X), 0, 0)
                             : FVector(0, FMath::Sign(Diff.Y), 0);

  // Try preferred direction
  if (CanMoveTo(MyLoc + PreferredDir * GridSize)) {
    CurrentDirection = PreferredDir;
    return;
  }

  // Try other axis
  FVector SecondaryDir = (PreferredDir.X != 0)
                             ? FVector(0, FMath::Sign(Diff.Y), 0)
                             : FVector(FMath::Sign(Diff.X), 0, 0);

  if (SecondaryDir.IsZero())
    SecondaryDir = FVector(1, 0, 0); // Fallback

  if (CanMoveTo(MyLoc + SecondaryDir * GridSize)) {
    CurrentDirection = SecondaryDir;
    return;
  }

  // If stuck, try random valid direction or reverse
  TArray<FVector> Dirs = {FVector(1, 0, 0), FVector(-1, 0, 0), FVector(0, 1, 0),
                          FVector(0, -1, 0)};
  for (const FVector &Dir : Dirs) {
    if (CanMoveTo(MyLoc + Dir * GridSize)) {
      CurrentDirection = Dir;
      return;
    }
  }

  CurrentDirection = -CurrentDirection; // Reverse as last resort
}

bool ABangGuChaEnemy::CanMoveTo(FVector NewLocation) {
  FHitResult Hit;
  FCollisionQueryParams Params;
  Params.AddIgnoredActor(this);

  bool bHit = GetWorld()->SweepSingleByChannel(
      Hit, GetActorLocation(), NewLocation, FQuat::Identity, ECC_WorldStatic,
      FCollisionShape::MakeBox(FVector(40.f)), Params);

  return !bHit;
}

void ABangGuChaEnemy::NotifyActorBeginOverlap(AActor *OtherActor) {
  Super::NotifyActorBeginOverlap(OtherActor);

  if (bIsStunned)
    return;

  if (ABangGuChaPawn *Player = Cast<ABangGuChaPawn>(OtherActor)) {
    // Game Over
    if (ABangGuChaGameModeBase *GM =
            Cast<ABangGuChaGameModeBase>(GetWorld()->GetAuthGameMode())) {
      GM->GameOver();
    }
  }
}

void ABangGuChaEnemy::Stun() {
  bIsStunned = true;
  StunTimer = StunDuration;
}
