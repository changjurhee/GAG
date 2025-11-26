#include "BangGuChaWall.h"
#include "Components/BoxComponent.h"
#include "Components/StaticMeshComponent.h"

ABangGuChaWall::ABangGuChaWall() {
  PrimaryActorTick.bCanEverTick = false;

  CollisionComp = CreateDefaultSubobject<UBoxComponent>(TEXT("CollisionComp"));
  RootComponent = CollisionComp;
  CollisionComp->SetBoxExtent(
      FVector(50.f, 50.f, 50.f)); // Assuming 100x100 tiles
  CollisionComp->SetCollisionProfileName(TEXT("BlockAll"));

  MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComp"));
  MeshComp->SetupAttachment(RootComponent);
}

void ABangGuChaWall::BeginPlay() { Super::BeginPlay(); }
